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

/**
 * Extracted verification data from message text.
 */
export interface VerificationData {
  /**
   * Extracted numeric verification code, if present (typically 4–8 digits).
   */
  code?: string;

  /**
   * Extracted magic link URL, if present.
   */
  magicLink?: string;

  /**
   * Whether the message appears to be a verification email.
   */
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

/**
 * Parse verification data (OTP code or magic link) from message text.
 *
 * Combines subject and body to increase detection coverage and returns any
 * matched numeric code (4-8 digits), a discovered magic link URL, and a
 * boolean indicating whether the message looks like a verification email.
 *
 * @param text Message body text to search.
 * @param subject Message subject to include in the search.
 * @returns VerificationData with code, magicLink, and isVerificationEmail.
 */
export function parseVerificationData(text: string, subject: string): VerificationData {
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
/**
 * Fetch a list of Gmail messages (metadata) then retrieve their details.
 *
 * @param accessToken OAuth2 access token with Gmail scopes.
 * @param query Optional Gmail query string to filter messages.
 * @param maxResults Maximum number of messages to return (default 15).
 * @returns Array of parsed messages (subject, from, body, code, magicLink, etc.).
 */
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
/**
 * Fetch detailed Gmail message by ID and parse headers/body into a structured format.
 *
 * @param accessToken OAuth2 access token with Gmail scopes.
 * @param messageId Gmail message ID to retrieve.
 * @returns ParsedGmailMessage or null if parsing fails.
 */
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
/**
 * Send an email using the Gmail API by composing a raw RFC822 message encoded in base64url.
 *
 * @param accessToken OAuth2 access token with Gmail send scope.
 * @param to Recipient email address.
 * @param subject Email subject.
 * @param body HTML body of the message.
 * @returns true on success, otherwise throws.
 */
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
/**
 * Move a Gmail message to Trash using the Gmail API.
 *
 * @param accessToken OAuth2 access token with Gmail scopes.
 * @param messageId Gmail message ID to trash.
 * @returns true when the API responds with ok status.
 */
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
