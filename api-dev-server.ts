import express from 'express';
import { createRequire } from 'module';
import { GoogleGenAI } from '@google/genai';
import { PhoneState } from './src/types';

const app = express();
const PORT = 4000;
app.use(express.json());

// Simple rate limiter
const RATE_LIMIT_WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000');
const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_MAX || '120');
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
    console.warn('Rate limiter error:', err);
    next();
  }
}

function apiKeyAuth(req: any, res: any, next: any) {
  const configured = process.env.ADMIN_API_KEY;
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

app.use('/api', rateLimiter);

// Try to load zod (optional)
let validateBody: any = (_: any) => (req: any, res: any, next: any) => next();
try {
  const require2 = createRequire(import.meta.url);
  const Z = require2('zod');
  const smsSendSchema = Z.object({ sender: Z.string().optional(), senderName: Z.string().optional(), body: Z.string().optional(), code: Z.string().min(1).max(64).optional(), link: Z.string().url().optional(), externalApp: Z.string().optional() });
  const totpAddSchema = Z.object({ issuer: Z.string().min(1), accountName: Z.string().optional(), secret: Z.string().min(8), icon: Z.string().optional() });
  const aiExtractSchema = Z.object({ rawText: Z.string().min(1) });
  validateBody = (schema: any) => (req: any, res: any, next: any) => {
    const result = schema.safeParse(req.body);
    if (!result.success) return res.status(400).json({ error: 'Invalid payload', details: result.error.format() });
    req.body = result.data;
    next();
  };
  // attach small subset for use below
  (global as any)._DEV_SCHEMAS = { smsSendSchema, totpAddSchema, aiExtractSchema };
} catch (err) {
  console.warn('Zod not available in dev-server; validation disabled.');
}

// Initial mock state copied from main server
let phoneState: PhoneState = {
  messages: [
    { id: 'msg_1', sender: '+1 (833) 555-0199', senderName: 'Google Security', avatarColor: 'bg-blue-600', body: 'G-749201 is your Google verification code. Never share this code with anyone.', code: '749201', timestamp: '10:14 AM', read: true },
  ],
  totpAccounts: [],
  pushRequests: [],
  calls: [],
  notes: [],
  settings: {
    phoneNumber: '+1 (555) 019-2834',
    carrier: 'CyberNet 5G',
    wallpaper: 'abstract',
    theme: 'dark',
    soundEnabled: true,
    hapticsEnabled: true,
    autoCopyOTP: true,
    modelStyle: 'iphone',
  },
};

// Routes (small subset used for smoke tests)
app.get('/api/phone/state', (req, res) => res.json(phoneState));

app.post('/api/sms/send', apiKeyAuth, (req, res, next) => {
  const schemas = (global as any)._DEV_SCHEMAS;
  const validator = schemas?.smsSendSchema ? (req2: any, res2: any, n2: any) => validateBody(schemas.smsSendSchema)(req2, res2, n2) : (_a: any, _b: any, n2: any) => n2();
  return validator(req, res, () => {
    const { sender, senderName, body, code, link, externalApp } = req.body;
    let extractedCode = code;
    if (!extractedCode && body) {
      const match = body.match(/\b\d{4,8}\b/);
      if (match) extractedCode = match[0];
    }
    const newMessage = {
      id: 'msg_' + Date.now(),
      sender: sender || '+1 (800) 2FA-CODE',
      senderName: senderName || (externalApp ? `${externalApp}` : 'Security Auth'),
      avatarColor: externalApp ? 'bg-purple-600' : 'bg-indigo-600',
      body: body || `Your verification code is ${extractedCode || '839201'}. Do not share it.`,
      code: extractedCode || '839201',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      read: false,
    };
    phoneState.messages.unshift(newMessage);
    phoneState.activeNotification = { id: newMessage.id, type: 'sms', title: newMessage.senderName, message: newMessage.body, code: newMessage.code };
    res.json({ success: true, message: newMessage, activeNotification: phoneState.activeNotification });
  });
});

app.post('/api/totp/add', apiKeyAuth, (req, res, next) => {
  const schemas = (global as any)._DEV_SCHEMAS;
  const validator = schemas?.totpAddSchema ? (req2: any, res2: any, n2: any) => validateBody(schemas.totpAddSchema)(req2, res2, n2) : (_a: any, _b: any, n2: any) => n2();
  return validator(req, res, () => {
    const { issuer, accountName, secret, icon } = req.body;
    if (!issuer || !secret) return res.status(400).json({ error: 'Issuer and secret are required' });
    const cleanSecret = secret.replace(/\s+/g, '').toUpperCase();
    const newTotp = { id: 'totp_' + Date.now(), issuer, accountName: accountName || 'user@example.com', secret: cleanSecret, icon: icon || 'key' };
    phoneState.totpAccounts.push(newTotp);
    res.json({ success: true, totp: newTotp });
  });
});

app.listen(PORT, '0.0.0.0', () => console.log(`API-only dev server listening on http://localhost:${PORT}`));
