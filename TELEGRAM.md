# Telegram integration

This document describes how Telegram account linking is implemented in this project: UI, HTTP API, persistence, and what is **mock** vs **production-ready**.

---

## Overview

Telegram is exposed as an optional notification channel: users connect from **Profile → Account** via a QR image and deep link to a Telegram bot. All server routes are **authenticated**. The backend stores link-related fields on the user document; **pushing real notifications requires a Telegram Bot API + webhook flow that is not wired in this codebase yet**.

---

## User experience

| Location | Path |
|----------|------|
| Profile page | `/profile` (Account tab) |

### Connected state

- If the API reports `linked: true`, the UI shows a success state and a **Disconnect** button.

### Connect flow

1. User clicks **Connect Telegram**.
2. Client calls:
   - `GET /api/telegram/qr` → receives a PNG image (blob) for the QR display.
   - `GET /api/telegram/link` → receives `{ link: string }` (Telegram deep link with `?start=` token).
3. UI expands: shows QR, **Open Telegram →** button, and short instructions (scan / open, press START, page updates).
4. Client starts **polling** `GET /api/telegram/status` every **3 seconds** while the panel is expanded. When `linked` becomes `true`, polling stops, the panel collapses, and a success toast-style message is shown.

### Disconnect flow

1. User confirms in a browser dialog.
2. Client calls `DELETE /api/telegram/unlink`.
3. Local UI sets disconnected state and shows success or error feedback.

**Implementation:** `client/pages/Profile.tsx` (Telegram state, effects, handlers, and the “Telegram Connection” card).

---

## HTTP API

All routes are registered in `server/index.ts` and require `authMiddleware`.

| Method | Path | Handler | Response (summary) |
|--------|------|---------|--------------------|
| `GET` | `/api/telegram/status` | `getStatus` | `{ linked: boolean }` |
| `GET` | `/api/telegram/link` | `getLink` | `{ link: string }` — saves `telegramToken` on user |
| `GET` | `/api/telegram/qr` | `getQR` | PNG image body (`Content-Type: image/png`) |
| `DELETE` | `/api/telegram/unlink` | `unlink` | `{ success: true, message: string }` — clears Telegram fields |

**Implementation:** `server/routes/telegram.ts`

### Authentication

- JSON endpoints use the shared `apiClient.request()` helper (Bearer token from auth storage).
- `getTelegramQR` uses `fetch` directly with `Authorization: Bearer <token>` because the response is a **binary blob**, not JSON.

**Implementation:** `client/services/api.ts` (`getTelegramStatus`, `getTelegramLink`, `getTelegramQR`, `disconnectTelegram`).

---

## Data model

User schema fields (MongoDB / Mongoose):

| Field | Type | Purpose |
|-------|------|--------|
| `telegramLinked` | `Boolean` (default `false`) | Whether the account is linked for notifications |
| `telegramChatId` | `String` (optional) | Telegram chat ID (for sending messages); cleared on unlink |
| `telegramToken` | `String` (optional) | Token embedded in bot deep link; set when link is generated |

**Implementation:** `server/db.ts` (`userSchema`).

---

## Server behavior (current)

### Status (`GET /api/telegram/status`)

- Loads the user by `req.user._id`.
- Returns `{ linked: !!user.telegramLinked }`.

### Link (`GET /api/telegram/link`)

- Generates a deterministic mock token: `token_${last 6 chars of user._id}`.
- Persists `user.telegramToken` and saves.
- Returns:

```text
https://t.me/ResumeMatchProBot?start=<token>
```

**Note:** The bot username `ResumeMatchProBot` is a **placeholder** for a real BotFather-created bot.

### QR (`GET /api/telegram/qr`)

- Does **not** encode the bot URL today.
- Returns a **small placeholder PNG** from an inline base64 buffer (not the actual deep link).

**Future improvement:** Generate a QR image from the same URL returned by `/api/telegram/link` so scanning matches the button link.

### Unlink (`DELETE /api/telegram/unlink`)

- Sets `telegramLinked = false`, clears `telegramChatId` and `telegramToken`, saves.

---

## Current limitations (important)

1. **No Telegram Bot service in this repo**  
   There is no webhook listener, no Bot API calls, and no code path that sets `telegramLinked = true` or `telegramChatId` when the user presses START in Telegram.

2. **Connect polling may never complete**  
   The UI polls until `linked` is true, but the mock handlers only set `telegramToken` on link generation and **never flip `telegramLinked`**. Until a real bot (or admin flow) updates those fields, users will not auto-complete “connected” from polling alone.

3. **QR is not the real link**  
   The QR image is decoupled from `getLink`; production should generate QR from the authenticated user’s link/token.

4. **No env vars for Telegram**  
   Bot token, webhook secret, and public bot username are not yet configured in `.env` / `server` config.

---

## Related frontend content

- **Marketing / demo video:** `client/components/WhatYouCanObtain.tsx` references `/videos/telegram.mp4` as a feature showcase asset (not part of the API).

---

## Files reference

| Area | File |
|------|------|
| Routes registration | `server/index.ts` |
| Telegram handlers | `server/routes/telegram.ts` |
| User fields | `server/db.ts` |
| Client API | `client/services/api.ts` |
| Profile UI | `client/pages/Profile.tsx` |

---

## Production checklist (when implementing for real)

1. Create a bot with BotFather; set `TELEGRAM_BOT_TOKEN` (server-only), bot username, and optional webhook secret.
2. Implement webhook (HTTPS) or long-polling worker to receive `/start <payload>` (or deep-link token), resolve user by token, store `telegramChatId`, set `telegramLinked: true`.
3. Replace `getQR` with QR generation from the same URL as `getLink`.
4. Use cryptographically random tokens (not derived from `_id` slices); expire or one-time use tokens as needed.
5. Send notifications via `https://api.telegram.org/bot<token>/sendMessage` (or a queue) using `telegramChatId`.

---

*Last updated to match the codebase as of this document’s creation.*
