# Cell-Phone — Development Notes

This README includes the same developer-focused run instructions and troubleshooting notes found in DEV.md.

Quick commands
- Full dev (frontend + server via Vite middleware):
  npm run dev
  (Requires native tailwind optional bindings in some environments — see notes)

- API-only dev server (fast, no Vite/Tailwind):
  ADMIN_API_KEY=test_admin_key npm run dev:api
  Listens on http://localhost:4000 by default

Important environment variables
- ADMIN_API_KEY — required in production to protect write endpoints. Set locally for testing.
- GEMINI_API_KEY — optional; enables AI extract endpoint.
- RATE_LIMIT_WINDOW_MS / RATE_LIMIT_MAX — in-memory rate limiter tuning.
- APP_URL — self-referential URL for some features.

Runtime notes
- The project tries to load @tailwindcss/vite and the oxide native binding. On some Windows/dev hosts the native binary may be missing and cause startup to fail. The dev server now falls back to running without the plugin so the server still starts.
- Recommended fix when native binding errors appear: remove node_modules and package-lock.json then reinstall (or run on Node >=20 where prebuilt binaries are available).

Validation and security
- Request validation is provided by Zod if installed. Install with:
  npm install zod
  (server logs a warning and gracefully disables validation when zod is not present)
- Do NOT commit real secrets to the repo. Use environment secrets in your deployment.

Smoke test examples (PowerShell)
- GET state:
  Invoke-RestMethod -Uri 'http://localhost:3000/api/phone/state'

- POST SMS (protected):
  Invoke-RestMethod -Uri 'http://localhost:3000/api/sms/send' -Method Post -Headers @{ 'x-api-key'='test_admin_key' } -Body (@{ senderName='Test'; body='Your code is 123456'; code='123456' } | ConvertTo-Json) -ContentType 'application/json'

Files of interest
- server.ts — main Express server + API routes
- api-dev-server.ts — lightweight API-only server for quick dev & smoke tests
- vite.config.ts — loads tailwind plugin optionally

If you want, I can also add a CI workflow or expand the README with architecture and contribution guidelines.
