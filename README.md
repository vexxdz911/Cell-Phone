Cell-Phone — Dev demo for 2FA / verification flows

This repository is a small React + Vite demo that simulates a phone UI for
verification flows (SMS, TOTP, push, voice). It includes a simple Express
server used during development to provide mock phone state and API endpoints.

Quick start

1. Install: npm install
2. Dev server: npm run dev
   - Runs the TypeScript server (tsx) + Vite dev middleware.
3. Build: npm run build
4. Start (production): npm run start

Environment

- Provide firebase-applet-config.json at the repo root for Firebase auth used by the client.
- (Optional) GEMINI_API_KEY for AI-based extraction in server /api/ai/extract-code.

Docs & notes

- JSDoc-style comments were added for exported helpers in src/lib (firebase, gmail, totp, sound).
  These describe inputs/outputs for fetchGmailMessages, parseVerificationData, generateTOTP, etc.
- Inline comments added to complex logic (Gmail parsing, AI fallback, sound engine).

Testing

- The server exposes endpoints under /api/* for demo actions (sms/send, push/send, totp/add, ai/extract-code).

If anything in this README is out of date or you prefer a different dev flow, tell me which commands or files to document and they will be updated.