# FORGE MVP v10

Premium dark/red fitness + nutrition MVP.

## What changed in v10
- New-account flow retained; each account starts at **0 steps** for the current day.
- No fake 7,420-step demo value.
- Step history remains per account and per day.
- Added a phone-step sync bridge hook. A native Android wrapper can expose `window.FORGE_NATIVE.getTodaySteps()` and FORGE will sync it. A normal browser/PWA cannot read the phone pedometer while the web page is closed; true background/Health Connect sync requires native Android integration.
- Food scan now accepts **photo + quantity/details text**. Example: `1 cup tea with milk, 2 rotis, 1 spoon sabzi, 1 cup dal, 2 spoons rice`.
- Added **Analyze Text Details** so users can estimate nutrition from written quantities too.
- Food scan gives a clear message when `index.html` is opened directly from `file://`; the AI endpoint needs a live server.
- Added a detailed **Muscle-build system**: nutrition targets, food choices, workout progression, recovery and daily checklist.
- Updated typography to Sora + Manrope for a cleaner installed-app look.
- Added a real password-reset OTP flow using email, with 10-minute OTP expiry.

## AI food scan / Vercel
Deploy this folder as a Vercel project. Add these environment variables:

- `OPENAI_API_KEY` — required for food analysis.
- `RESET_SECRET` — a long random secret used to protect password-reset tokens.
- `RESEND_API_KEY` — required to send password-reset emails.
- `FORGE_FROM_EMAIL` — a verified sender address/domain in your email provider.

The AI endpoint uses `gpt-5.6-luna` with image input through the Responses API.

## Local run
Install Node.js 20+.

1. Open a terminal in this folder.
2. Set `OPENAI_API_KEY` (and reset-email variables if you want password reset locally).
3. Run `npm start`.
4. Open `http://localhost:3000`.

Do **not** open `index.html` by double-clicking it if you want AI scan; that uses `file://` and has no backend API.

## Step tracking limitation
The web MVP cannot legally/technically keep reading a phone pedometer after the browser/app is closed. On Android, the production solution is a native Health Connect integration. The web UI is already prepared for a native bridge named `FORGE_NATIVE.getTodaySteps()`.

## Password reset
The reset screen sends a 6-digit OTP by email through Resend. After OTP verification, the local MVP account password is updated. For a production multi-device app, move account/password storage to a real auth database/service rather than localStorage.
