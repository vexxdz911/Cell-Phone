import { createRequire } from 'module';
import type { Request, Response, NextFunction, RequestHandler } from 'express';

// Exports: validateBody, and named schemas
let validateBody: (schema: any) => RequestHandler;
let smsSendSchema: any,
  webhookSchema: any,
  pushSendSchema: any,
  pushRespondSchema: any,
  voiceCallSchema: any,
  totpAddSchema: any,
  totpDeleteSchema: any,
  settingsSchema: any,
  aiExtractSchema: any;

// Default no-op implementations (used when zod is not available)
validateBody = (_: any) => (_req: Request, _res: Response, next: NextFunction) => next();

try {
  const require2 = createRequire(import.meta.url);
  const Z = require2('zod');

  smsSendSchema = Z.object({
    sender: Z.string().optional(),
    senderName: Z.string().optional(),
    body: Z.string().optional(),
    code: Z.string().min(1).max(64).optional(),
    link: Z.string().url().optional(),
    externalApp: Z.string().optional(),
  });

  webhookSchema = Z.object({
    appName: Z.string().optional(),
    senderName: Z.string().optional(),
    body: Z.string().optional(),
    code: Z.string().min(1).max(64).optional(),
    magicLink: Z.string().url().optional(),
    type: Z.string().optional(),
    service: Z.string().optional(),
  });

  pushSendSchema = Z.object({
    service: Z.string().optional(),
    location: Z.string().optional(),
    ipAddress: Z.string().optional(),
    promptType: Z.enum(['simple', 'number_matching']).optional(),
    matchingNumber: Z.number().optional(),
  });

  pushRespondSchema = Z.object({
    id: Z.string(),
    status: Z.enum(['approved', 'denied']),
    selectedNumber: Z.number().optional(),
  });

  voiceCallSchema = Z.object({
    caller: Z.string().optional(),
    callerName: Z.string().optional(),
    code: Z.string().min(1).max(64).optional(),
    spokenMessage: Z.string().optional(),
  });

  totpAddSchema = Z.object({
    issuer: Z.string().min(1),
    accountName: Z.string().optional(),
    secret: Z.string().min(8),
    icon: Z.string().optional(),
  });

  totpDeleteSchema = Z.object({ id: Z.string() });

  settingsSchema = Z.object({
    phoneNumber: Z.string().optional(),
    carrier: Z.string().optional(),
    wallpaper: Z.string().optional(),
    theme: Z.string().optional(),
    soundEnabled: Z.boolean().optional(),
    hapticsEnabled: Z.boolean().optional(),
    autoCopyOTP: Z.boolean().optional(),
    modelStyle: Z.string().optional(),
  });

  aiExtractSchema = Z.object({ rawText: Z.string().min(1) });

  validateBody = (schema: any) => (req: Request, res: Response, next: NextFunction) => {
    // If schema is not provided or doesn't look like a zod schema, skip validation
    if (!schema || typeof schema.safeParse !== 'function') return next();
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: 'Invalid request payload', details: result.error.format() });
    }
    req.body = result.data;
    next();
  };
} catch (err) {
  console.warn('Zod not installed or failed to load; request validation disabled. Run `npm install zod` to enable.');
}

export {
  validateBody,
  smsSendSchema,
  webhookSchema,
  pushSendSchema,
  pushRespondSchema,
  voiceCallSchema,
  totpAddSchema,
  totpDeleteSchema,
  settingsSchema,
  aiExtractSchema,
};
