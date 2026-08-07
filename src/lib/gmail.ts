export interface GmailMessageItem {
  id: string;
  threadId: string;
}

export interface ParsedGmailMessage {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  to: string;
  date: string;
  snippet: string;
  body: string;
  code?: string;
  magicLink?: string;
  isVerificationEmail: boolean;
}

// Decode base64url from Gmail payload
function decodeBase64Url(input: string): string {
  try {
    let base64 = input.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }
    return decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
  } catch {
    return input;
  }
}

// Recursively get email text body from parts
function extractBodyParts(payload: any): string {
  if (!payload) return '';
  if (payload.body?.data) {
    return decodeBase64Url(payload.body.data);
  }
  if (payload.parts && Array.isArray(payload.parts)) {
    for (const part of payload.parts) {
      if (part.mimeType === 'text/plain' && part.body?.data) {
        return decodeBase64Url(part.body.data);
      }
    }
    for (const part of payload.parts) {
      if (part.mimeType === 'text/html' && part.body?.data) {
        return decodeBase64Url(part.body.data);
      }
      if (part.parts) {
        const nested = extractBodyParts(part);
        if (nested) return nested;
      }
    }
  }
  return '';
}

// Extract 2FA code or magic link from message text
export function parseVerificationData(text: string, subject: string) {
  const combined = `${subject} ${text}`;

  // Match 4 to 8 digit verification code
  const codeMatch = combined.match(/\b(\d{4,8})\b/);
  const code = codeMatch ? codeMatch[1] : undefined;

  // Match magic link URL
  const urlMatch = text.match(/(https?:\/\/[^\s<>"']+(?:verify|login|auth|confirm|token|magic|code)[^\s<>"']*)/i)
    || text.match(/(https?:\/\/[^\s<>"']+)/i);
  const magicLink = urlMatch ? urlMatch[1] : undefined;

  const isVerificationEmail =
    /verification|verify|code|otp|2fa|authentication|passcode|confirm|login|security/i.test(combined);

  return { code, magicLink, isVerificationEmail };
}

// List messages from Gmail API
export async function fetchGmailMessages(
  accessToken: string,
  query: string = '',
  maxResults: number = 15
): Promise<ParsedGmailMessage[]> {
  const endpoint = `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxResults}${
    query ? `&q=${encodeURIComponent(query)}` : ''
  }`;

  const res = await fetch(endpoint, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error?.message || `Gmail API error ${res.status}`);
  }

  const data = await res.json();
  const messagesList: GmailMessageItem[] = data.messages || [];

  if (messagesList.length === 0) {
    return [];
  }

  // Fetch details for top messages
  const detailsList = await Promise.all(
    messagesList.slice(0, maxResults).map((m) => fetchGmailMessageDetails(accessToken, m.id))
  );

  return detailsList.filter((m): m is ParsedGmailMessage => m !== null);
}

// Fetch single message details
export async function fetchGmailMessageDetails(
  accessToken: string,
  messageId: string
): Promise<ParsedGmailMessage | null> {
  try {
    const res = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!res.ok) return null;

    const data = await res.json();
    const headers = data.payload?.headers || [];

    const getHeader = (name: string) =>
      headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || '';

    const subject = getHeader('Subject') || '(No Subject)';
    const from = getHeader('From') || 'Unknown Sender';
    const to = getHeader('To') || '';
    const date = getHeader('Date') || '';
    const snippet = data.snippet || '';

    const body = extractBodyParts(data.payload) || snippet;
    const { code, magicLink, isVerificationEmail } = parseVerificationData(body, subject);

    return {
      id: data.id,
      threadId: data.threadId,
      subject,
      from,
      to,
      date,
      snippet,
      body,
      code,
      magicLink,
      isVerificationEmail,
    };
  } catch (error) {
    console.error('Failed to parse Gmail message details:', error);
    return null;
  }
}

// Send Email via Gmail API
export async function sendGmailEmail(
  accessToken: string,
  to: string,
  subject: string,
  body: string
): Promise<boolean> {
  const emailLines = [
    `To: ${to}`,
    'Content-Type: text/html; charset=utf-8',
    'MIME-Version: 1.0',
    `Subject: ${subject}`,
    '',
    body,
  ];

  const emailRaw = emailLines.join('\r\n');
  const base64Encoded = btoa(unescape(encodeURIComponent(emailRaw)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      raw: base64Encoded,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to send email via Gmail API');
  }

  return true;
}

// Trash Message via Gmail API
export async function trashGmailMessage(accessToken: string, messageId: string): Promise<boolean> {
  const res = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/trash`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  return res.ok;
}
