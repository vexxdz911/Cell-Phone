# Cell-Phone — Dev demo for 2FA / verification flows

This repository is a small React + Vite demo that simulates a phone UI for verification flows (SMS, TOTP, push, voice). It includes a simple Express server used during development to provide mock phone state and API endpoints.

## Quick start

1. Install: `npm install`
2. Dev server: `npm run dev`
   - Runs the TypeScript server (tsx) + Vite dev middleware
3. Build: `npm run build`
4. Start (production): `npm run start`

## Environment

- Provide `firebase-applet-config.json` at the repo root for Firebase auth used by the client
- (Optional) `GEMINI_API_KEY` for AI-based extraction in server `/api/ai/extract-code`

## Documentation

### JSDoc & Type Definitions

JSDoc-style comments were added for exported helpers in `src/lib/`:
- **firebase.ts**: OAuth sign-in flow, auth state management, token caching
- **gmail.ts**: Message parsing, verification code extraction, Gmail API integration (includes new `VerificationData` interface for type safety)
- **totp.ts**: TOTP code generation, secret provisioning
- **sound.ts**: Web Audio and Speech Synthesis utilities

These describe inputs, outputs, and parameter semantics for all public functions.

### Inline Comments

Complex logic is annotated:
- Gmail MIME part parsing and base64url decoding
- Verification data extraction (code/link patterns)
- AI extraction route with fallback regex behavior when `GEMINI_API_KEY` is missing

## Testing

The server exposes endpoints under `/api/*` for demo actions:
- `/api/sms/send` — Trigger SMS verification codes
- `/api/push/send` — Trigger push approval requests
- `/api/totp/add` — Add TOTP accounts
- `/api/ai/extract-code` — Extract codes from unformatted text (with AI fallback)

If anything in this README is out of date or you prefer a different dev flow, please file an issue or update the documentation accordingly.