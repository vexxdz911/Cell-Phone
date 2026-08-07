import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { PhoneState, SMSMessage, TOTPAccount, PushRequest, VoiceCall } from "./src/types";
import { z } from 'zod';

const app = express();
const PORT = 3000;

app.use(express.json());

// --- Security Middlewares ---
// Simple in-memory rate limiter and API key auth to protect mutable endpoints.
const RATE_LIMIT_WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'); // window in ms
const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_MAX || '120'); // max requests per window
const _ipBuckets: Map<string, { count: number; start: number }> = new Map();

function rateLimiter(req: any, res: any, next: any) {
  try {
    const ip = (req.ip || req.connection?.remoteAddress || 'unknown').toString();
    const now = Date.now();
    const bucket = _ipBuckets.get(ip) || { count: 0, start: now };
    if (now - bucket.start > RATE_LIMIT_WINDOW_MS) {
      bucket.count = 1;
      bucket.start = now;
    } else {
      bucket.count++;
    }
    _ipBuckets.set(ip, bucket);
    if (bucket.count > RATE_LIMIT_MAX) {
      return res.status(429).json({ error: 'Too many requests (rate limit exceeded)' });
    }
    next();
  } catch (err) {
    // Fail open on unexpected error so legitimate traffic isn't blocked by middleware bugs
    console.warn('Rate limiter error:', err);
    next();
  }
}

function apiKeyAuth(req: any, res: any, next: any) {
  const configured = process.env.ADMIN_API_KEY;
  // If ADMIN_API_KEY not configured, allow in non-production for dev convenience
  if (!configured) {
    if (process.env.NODE_ENV === 'production') {
      return res.status(500).json({ error: 'Server misconfigured: ADMIN_API_KEY not set' });
    }
    console.warn('ADMIN_API_KEY not configured; skipping auth (dev only)');
    return next();
  }

  const headerKey = (req.headers['x-api-key'] || req.query?.api_key || '').toString();
  const bearer = (req.headers['authorization'] || '').toString().replace(/^Bearer\s+/i, '');
  const provided = headerKey || bearer;

  if (!provided || provided !== configured) {
    return res.status(401).json({ error: 'Unauthorized: invalid API key' });
  }
  next();
}

// Validation schemas and helper (Zod)
const smsSendSchema = z.object({
  sender: z.string().optional(),
  senderName: z.string().optional(),
  body: z.string().optional(),
  code: z.string().min(1).max(64).optional(),
  link: z.string().url().optional(),
  externalApp: z.string().optional(),
});

const webhookSchema = z.object({
  appName: z.string().optional(),
  senderName: z.string().optional(),
  body: z.string().optional(),
  code: z.string().min(1).max(64).optional(),
  magicLink: z.string().url().optional(),
  type: z.string().optional(),
  service: z.string().optional(),
});

const pushSendSchema = z.object({
  service: z.string().optional(),
  location: z.string().optional(),
  ipAddress: z.string().optional(),
  promptType: z.enum(['simple', 'number_matching']).optional(),
  matchingNumber: z.number().optional(),
});

const pushRespondSchema = z.object({
  id: z.string(),
  status: z.enum(['approved', 'denied']),
  selectedNumber: z.number().optional(),
});

const voiceCallSchema = z.object({
  caller: z.string().optional(),
  callerName: z.string().optional(),
  code: z.string().min(1).max(64).optional(),
  spokenMessage: z.string().optional(),
});

const totpAddSchema = z.object({
  issuer: z.string().min(1),
  accountName: z.string().optional(),
  secret: z.string().min(8),
  icon: z.string().optional(),
});

const totpDeleteSchema = z.object({ id: z.string() });

const settingsSchema = z.object({
  phoneNumber: z.string().optional(),
  carrier: z.string().optional(),
  wallpaper: z.string().optional(),
  theme: z.string().optional(),
  soundEnabled: z.boolean().optional(),
  hapticsEnabled: z.boolean().optional(),
  autoCopyOTP: z.boolean().optional(),
  modelStyle: z.string().optional(),
});

const aiExtractSchema = z.object({ rawText: z.string().min(1) });

function validateBody(schema: any) {
  return (req: any, res: any, next: any) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: 'Invalid request payload', details: result.error.format() });
    }
    req.body = result.data;
    next();
  };
}

// Apply rate limiter globally to /api endpoints
app.use('/api', rateLimiter);

// Initial mock state for phone
let phoneState: PhoneState = {
  messages: [
    {
      id: "msg_1",
      sender: "+1 (833) 555-0199",
      senderName: "Google Security",
      avatarColor: "bg-blue-600",
      body: "G-749201 is your Google verification code. Never share this code with anyone.",
      code: "749201",
      timestamp: "10:14 AM",
      read: true,
    },
    {
      id: "msg_2",
      sender: "28888",
      senderName: "GitHub Auth",
      avatarColor: "bg-gray-800",
      body: "[GitHub] Your authentication code is 482019. It will expire in 10 minutes.",
      code: "482019",
      timestamp: "10:02 AM",
      read: true,
    },
    {
      id: "msg_3",
      sender: "24273",
      senderName: "Chase Bank",
      avatarColor: "bg-blue-800",
      body: "Chase Bank: Use 918342 to verify your sign-in request on Chrome OS.",
      code: "918342",
      timestamp: "Yesterday",
      read: true,
    },
  ],
  totpAccounts: [
    {
      id: "totp_1",
      issuer: "GitHub",
      accountName: "developer@company.com",
      secret: "JBSWY3DPEHPK3PXP", // Demo standard key
      icon: "github",
    },
    {
      id: "totp_2",
      issuer: "AWS Console",
      accountName: "admin@production-vpc",
      secret: "K43X2MZSOT54LQAQ",
      icon: "aws",
    },
    {
      id: "totp_3",
      issuer: "Google Work",
      accountName: "user@workspace.io",
      secret: "HXDMVJECJJWGY33D",
      icon: "google",
    },
  ],
  pushRequests: [
    {
      id: "push_1",
      service: "Okta Work SSO",
      serviceLogo: "okta",
      location: "San Francisco, CA, USA",
      ipAddress: "192.168.1.104",
      timestamp: "Just now",
      status: "pending",
      promptType: "simple",
    },
  ],
  calls: [],
  notes: [
    {
      id: "note_1",
      title: "GitHub Emergency Backup Codes",
      service: "GitHub",
      codes: ["8x92-a1b2", "3c4d-5e6f", "7g8h-9i0j", "1k2l-3m4n", "5o6p-7q8r"],
      createdAt: "Aug 1, 2026",
    },
    {
      id: "note_2",
      title: "AWS Root Account Recovery",
      service: "AWS",
      codes: ["aws-rec-9821-4401", "aws-rec-1102-7729"],
      createdAt: "Jul 15, 2026",
    },
  ],
  settings: {
    phoneNumber: "+1 (555) 019-2834",
    carrier: "CyberNet 5G",
    wallpaper: "abstract",
    theme: "dark",
    soundEnabled: true,
    hapticsEnabled: true,
    autoCopyOTP: true,
    modelStyle: "iphone",
  },
};

// --- API ROUTES ---

// Get full phone state
app.get("/api/phone/state", (req, res) => {
  res.json(phoneState);
});

// Trigger SMS Code
app.post("/api/sms/send", apiKeyAuth, validateBody(smsSendSchema), (req, res) => {
  const { sender, senderName, body, code, link, externalApp } = req.body;
  
  // Extract 6 digit or 4-8 digit number if code not explicitly provided
  let extractedCode = code;
  if (!extractedCode && body) {
    const match = body.match(/\b\d{4,8}\b/);
    if (match) extractedCode = match[0];
  }

  // Extract link if present in body and not explicitly provided
  let extractedLink = link;
  if (!extractedLink && body) {
    const urlMatch = body.match(/https?:\/\/[^\s]+/i);
    if (urlMatch) extractedLink = urlMatch[0];
  }

  const newMessage: SMSMessage = {
    id: "msg_" + Date.now(),
    sender: sender || "+1 (800) 2FA-CODE",
    senderName: senderName || (externalApp ? `${externalApp}` : "Security Auth"),
    avatarColor: externalApp ? "bg-purple-600" : "bg-indigo-600",
    body: body || (extractedLink ? `Click here to complete verification: ${extractedLink}` : `Your verification code is ${extractedCode || '839201'}. Do not share it.`),
    code: extractedCode || (extractedLink ? undefined : "839201"),
    link: extractedLink,
    externalApp: externalApp || undefined,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    read: false,
  };

  phoneState.messages.unshift(newMessage);
  phoneState.activeNotification = {
    id: newMessage.id,
    type: "sms",
    title: externalApp ? `[${externalApp}] Verification` : newMessage.senderName,
    message: newMessage.body,
    code: newMessage.code,
    link: newMessage.link,
    externalApp: newMessage.externalApp,
  };

  res.json({ success: true, message: newMessage, activeNotification: phoneState.activeNotification });
});

// Generic Inbound Webhook / External App Verification Endpoint
app.post(["/api/webhook/2fa", "/api/integration/send-code"], apiKeyAuth, validateBody(webhookSchema), (req, res) => {
  const { appName, senderName, body, code, magicLink, type, service } = req.body;
  const sourceApp = appName || senderName || service || "External Application";

  let extractedCode = code;
  if (!extractedCode && body) {
    const match = body.match(/\b\d{4,8}\b/);
    if (match) extractedCode = match[0];
  }

  let extractedLink = magicLink;
  if (!extractedLink && body) {
    const urlMatch = body.match(/https?:\/\/[^\s]+/i);
    if (urlMatch) extractedLink = urlMatch[0];
  }

  if (type === "push") {
    const newPush: PushRequest = {
      id: "push_" + Date.now(),
      service: sourceApp,
      location: "External Integration",
      ipAddress: "10.0.4.12",
      timestamp: "Just now",
      status: "pending",
      promptType: "simple",
    };

    phoneState.pushRequests.unshift(newPush);
    phoneState.activeNotification = {
      id: newPush.id,
      type: "push",
      title: `${sourceApp} Sign-in Request`,
      message: body || `Verification request triggered from ${sourceApp}. Tap to approve.`,
      externalApp: sourceApp,
    };

    return res.json({ success: true, mode: "push", pushRequest: newPush, activeNotification: phoneState.activeNotification });
  }

  const newMessage: SMSMessage = {
    id: "msg_" + Date.now(),
    sender: sourceApp,
    senderName: sourceApp,
    avatarColor: "bg-purple-600",
    body: body || (extractedLink ? `Magic Link Verification: ${extractedLink}` : `Your ${sourceApp} verification code is ${extractedCode || '948201'}.`),
    code: extractedCode || (!extractedLink ? "948201" : undefined),
    link: extractedLink || undefined,
    externalApp: sourceApp,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    read: false,
  };

  phoneState.messages.unshift(newMessage);
  phoneState.activeNotification = {
    id: newMessage.id,
    type: "sms",
    title: `[${sourceApp}] Verification`,
    message: newMessage.body,
    code: newMessage.code,
    link: newMessage.link,
    externalApp: sourceApp,
  };

  res.json({
    success: true,
    mode: "message",
    message: newMessage,
    activeNotification: phoneState.activeNotification,
    note: "Received via external application integration endpoint"
  });
});

// Trigger Push Approval Request
app.post("/api/push/send", apiKeyAuth, validateBody(pushSendSchema), (req, res) => {
  const { service, location, ipAddress, promptType, matchingNumber } = req.body;

  let numbers: number[] = [];
  let targetNumber = matchingNumber;

  if (promptType === "number_matching") {
    if (!targetNumber) {
      targetNumber = Math.floor(Math.random() * 89) + 10;
    }
    const num1 = (targetNumber + 15) % 90 + 10;
    const num2 = Math.abs(targetNumber - 23) % 90 + 10;
    numbers = [targetNumber, num1, num2].sort(() => Math.random() - 0.5);
  }

  const newPush: PushRequest = {
    id: "push_" + Date.now(),
    service: service || "Corporate Identity",
    location: location || "San Francisco, USA",
    ipAddress: ipAddress || "172.56.21.9",
    timestamp: "Just now",
    status: "pending",
    promptType: promptType || "simple",
    matchingNumber: targetNumber,
    numberOptions: numbers.length > 0 ? numbers : undefined,
  };

  phoneState.pushRequests.unshift(newPush);
  phoneState.activeNotification = {
    id: newPush.id,
    type: "push",
    title: `${newPush.service} Sign-in Request`,
    message: `Sign-in attempt from ${newPush.location}. Tap to verify.`,
  };

  res.json({ success: true, pushRequest: newPush });
});

// Respond to push request (Approve/Deny)
app.post("/api/push/respond", apiKeyAuth, validateBody(pushRespondSchema), (req, res) => {
  const { id, status, selectedNumber } = req.body;
  const push = phoneState.pushRequests.find((p) => p.id === id);

  if (!push) {
    return res.status(404).json({ error: "Push request not found" });
  }

  if (push.promptType === "number_matching" && status === "approved") {
    if (selectedNumber !== push.matchingNumber) {
      push.status = "denied";
      return res.json({ success: false, status: "denied", message: "Incorrect number selected!" });
    }
  }

  push.status = status;
  res.json({ success: true, push });
});

// Trigger Voice Verification Call
app.post("/api/voice/call", apiKeyAuth, validateBody(voiceCallSchema), (req, res) => {
  const { caller, callerName, code, spokenMessage } = req.body;
  const verificationCode = code || String(Math.floor(100000 + Math.random() * 900000));

  const newCall: VoiceCall = {
    id: "call_" + Date.now(),
    caller: caller || "+1 (888) 555-0100",
    callerName: callerName || "Automated Voice Auth",
    code: verificationCode,
    spokenMessage: spokenMessage || `Hello. Your security verification code is ${verificationCode.split('').join(' ')}. Again, your code is ${verificationCode.split('').join(' ')}. Goodbye.`,
    timestamp: "Incoming",
    status: "incoming",
  };

  phoneState.calls.unshift(newCall);
  phoneState.activeNotification = {
    id: newCall.id,
    type: "call",
    title: newCall.callerName,
    message: "Incoming voice authentication call...",
    code: newCall.code,
  };

  res.json({ success: true, call: newCall });
});

// Add TOTP Account
app.post("/api/totp/add", apiKeyAuth, validateBody(totpAddSchema), (req, res) => {
  const { issuer, accountName, secret, icon } = req.body;
  if (!issuer || !secret) {
    return res.status(400).json({ error: "Issuer and secret are required" });
  }

  // Clean secret
  const cleanSecret = secret.replace(/\s+/g, "").toUpperCase();

  const newTotp: TOTPAccount = {
    id: "totp_" + Date.now(),
    issuer,
    accountName: accountName || "user@example.com",
    secret: cleanSecret,
    icon: icon || "key",
  };

  phoneState.totpAccounts.push(newTotp);
  res.json({ success: true, totp: newTotp });
});

// Delete TOTP Account
app.post("/api/totp/delete", apiKeyAuth, validateBody(totpDeleteSchema), (req, res) => {
  const { id } = req.body;
  phoneState.totpAccounts = phoneState.totpAccounts.filter((t) => t.id !== id);
  res.json({ success: true });
});

// Update Phone Settings
app.post("/api/phone/settings", apiKeyAuth, validateBody(settingsSchema), (req, res) => {
  const newSettings = req.body;
  phoneState.settings = { ...phoneState.settings, ...newSettings };
  res.json({ success: true, settings: phoneState.settings });
});

// Clear notifications / messages
app.post("/api/phone/clear", apiKeyAuth, (req, res) => {
  phoneState.messages = [];
  phoneState.pushRequests = [];
  phoneState.calls = [];
  phoneState.activeNotification = undefined;
  res.json({ success: true });
});

// AI extract verification code from unformatted text/email
app.post("/api/ai/extract-code", apiKeyAuth, validateBody(aiExtractSchema), async (req, res) => {
  try {
    const { rawText } = req.body;
    if (!rawText) {
      return res.status(400).json({ error: "rawText is required" });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      // Fallback regex if API key not available
      const codeMatch = rawText.match(/\b\d{4,8}\b/);
      return res.json({
        code: codeMatch ? codeMatch[0] : null,
        sender: "Extracted Message",
        summary: "Extracted verification code using pattern matching.",
      });
    }

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `You are an AI 2FA Verification Assistant.
Extract the 2FA / OTP verification code, sender name, and service context from the following text (it could be an email snippet, webhook log, or notification):

"""
${rawText}
"""

Return JSON format strictly:
{
  "code": "extracted 4-8 digit code or alphanumeric token or null",
  "sender": "Service name like Google, GitHub, Bank, Okta, Slack, etc.",
  "summary": "Short 1-sentence clean summary of the message body"
}`,
    });

    const responseText = response.text || "";
    const cleanJson = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(cleanJson);

    res.json(parsed);
  } catch (err: any) {
    console.error("AI extraction error:", err);
    res.status(500).json({ error: err.message || "Failed to extract code" });
  }
});

// --- VITE & STATIC SERVER CONFIG ---
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*all", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
