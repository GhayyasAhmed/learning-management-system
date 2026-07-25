# ELearning — Full‑Stack Learning Management System

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![Express](https://img.shields.io/badge/Express-5-black?logo=express)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?logo=mongodb&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-ioredis-DC382D?logo=redis&logoColor=white)
![Stripe](https://img.shields.io/badge/Payments-Stripe-635BFF?logo=stripe&logoColor=white)
![Socket.IO](https://img.shields.io/badge/Realtime-Socket.IO-010101?logo=socket.io)
![License](https://img.shields.io/badge/License-MIT-lightgrey)

A production-shaped, full‑stack LMS: students discover, purchase, and consume video
courses; instructors/admins author courses and moderate the catalog from a dedicated
dashboard. Built as a **monorepo** with an independently deployable **Next.js 16**
frontend and an **Express 5 / MongoDB / Redis** API, wired together with JWT auth,
Stripe payments, Cloudinary media storage, VdoCipher secure video playback, and
Socket.IO for real-time admin notifications.

This README covers the project as a whole — architecture, prerequisites, and the
fastest path to a working local environment. App-specific details live in:

- 📄 [`server/README.md`](./server/README.md) — API design, env vars, endpoints, data
  models, operational notes
- 📄 [`client/README.md`](./client/README.md) — frontend architecture, auth flow,
  feature walkthrough, env vars

---

## Table of Contents

- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Monorepo Layout](#monorepo-layout)
- [Prerequisites](#prerequisites)
- [Getting Started (Local Development)](#getting-started-local-development)
- [Verifying Your Setup](#verifying-your-setup)
- [Creating Your First Admin User](#creating-your-first-admin-user)
- [Troubleshooting](#troubleshooting)
- [Engineering Notes](#engineering-notes)
- [Known Gaps / Roadmap](#known-gaps--roadmap)
- [License](#license)

---

## Architecture

```
                         ┌───────────────────────────┐
                         │      Browser (Client)      │
                         │  Next.js 16 / React 19      │
                         │  Redux Toolkit + RTK Query   │
                         └───────────┬────────────────┘
                                     │ HTTPS (cookies: accessToken/refreshToken)
                                     │ REST  /api/v1/*         WebSocket
                                     ▼                             ▼
                         ┌───────────────────────────┐   ┌─────────────────┐
                         │     Express 5 API server    │──►│   Socket.IO      │
                         │  Auth · Courses · Orders ·  │   │  (notifications) │
                         │  Layout · Analytics          │   └─────────────────┘
                         └───────┬───────────┬─────────┘
                                 │           │
              ┌──────────────────┘           └───────────────────┐
              ▼                                                   ▼
     ┌─────────────────┐                                ┌───────────────────┐
     │     MongoDB       │                                │       Redis         │
     │ Users / Courses /  │                                │ JWT sessions ·       │
     │ Orders / Layout /   │                                │ public course cache   │
     │ Notifications        │                                └───────────────────┘
     └─────────────────┘

        Outbound integrations from the API server:
        ┌────────────┐   ┌────────────┐   ┌────────────┐   ┌────────────┐
        │ Cloudinary  │   │   Stripe    │   │ VdoCipher   │   │ SMTP (mail) │
        │ media store │   │  payments   │   │ video OTP   │   │ activation/  │
        └────────────┘   └────────────┘   └────────────┘   │ order emails │
                                                              └────────────┘
```

**Request flow in short:** the client authenticates against the API and receives
httpOnly `accessToken`/`refreshToken` cookies; every protected route runs a silent
token-refresh middleware before checking the session in Redis; course reads are served
from a Redis cache (sanitized — no lesson video URLs) until an admin edits the course;
purchases go through a server-computed Stripe PaymentIntent so the client can never
manipulate price; and course/user/order mutations fan out real-time notifications to
connected admin dashboards over Socket.IO.

## Tech Stack

| Layer | Choices |
|---|---|
| Frontend framework | Next.js 16 (App Router), React 19, TypeScript |
| Frontend state/data | Redux Toolkit, RTK Query |
| Frontend auth | NextAuth (Google/GitHub OAuth) bridged to a custom JWT backend session |
| Frontend UI | Tailwind CSS 4, MUI + MUI X DataGrid, Recharts, react-hot-toast |
| Payments (client) | Stripe.js / React Stripe.js |
| Backend framework | Express 5, TypeScript (ESM/NodeNext) |
| Database | MongoDB via Mongoose 9 |
| Cache / sessions | Redis via ioredis |
| Auth | JWT (short-lived access + rotating refresh tokens), bcryptjs |
| Media | Cloudinary |
| Payments (server) | Stripe PaymentIntents |
| Video | VdoCipher (OTP-based secure playback) |
| Email | Nodemailer + EJS templates |
| Realtime | Socket.IO |
| Scheduled jobs | node-cron |

## Monorepo Layout

```
.
├── client/     Next.js frontend — see client/README.md
├── server/     Express API — see server/README.md
└── README.md   (this file)
```

The two apps are **decoupled** — they run as separate processes, talk over HTTP/WS, and
can be deployed independently (e.g., client on Vercel, server on Render/Railway/EC2/etc.).

## Prerequisites

Install these before you start:

| Requirement | Version | Notes |
|---|---|---|
| Node.js | ≥ 20.9 (LTS recommended) | Required by Next.js 16 and the server's `NodeNext` module resolution |
| npm | ships with Node | `pnpm`/`yarn` will also work, but the lockfiles here are npm |
| MongoDB | 6+ | Local install, Docker, or a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster |
| Redis | 6+ | Local install, Docker, or a managed instance (e.g., Upstash) |
| Git | any recent | to clone the repo |

You will also need free/test accounts for the third‑party services the app integrates
with. All of these have free tiers suitable for local development:

- **[Cloudinary](https://cloudinary.com/)** — image storage (course thumbnails, avatars, hero banner)
- **[Stripe](https://dashboard.stripe.com/register)** — use your **test mode** publishable/secret keys
- **[VdoCipher](https://www.vdocipher.com/)** — video hosting/OTP (only needed if you want lesson playback to work end-to-end)
- An SMTP account for outbound email — a Gmail account with an
  [App Password](https://myaccount.google.com/apppasswords) works well for local dev
- **Google** and **GitHub** OAuth apps (only needed if you want to test social login) —
  set the redirect URI to `http://localhost:3000/api/auth/callback/google` and
  `http://localhost:3000/api/auth/callback/github` respectively

> None of the third-party integrations are hard-blockers to getting the app running —
> see [Troubleshooting](#troubleshooting) for what happens (and how to work around it)
> if a given key is missing.

## Getting Started (Local Development)

### 1. Clone the repository

```bash
git clone <this-repo-url>
cd <repo-folder>
```

### 2. Start MongoDB and Redis

If you don't already have them running locally, the fastest path is Docker:

```bash
docker run -d --name lms-mongo -p 27017:27017 mongo:7
docker run -d --name lms-redis -p 6379:6379 redis:7
```

(Or point `MONGO_URI` / `REDIS_URL` at Atlas / Upstash / any managed instance instead.)

### 3. Configure the server

```bash
cd server
cp .env.example .env   # or create .env manually — see server/README.md for the full list
npm install
```

At minimum, set `MONGO_URI`, `REDIS_URL`, `ACCESS_TOKEN`, `REFRESH_TOKEN`, and
`ACTIVATION_SECRET` (any random strings for the secrets are fine locally). Full variable
list and explanations: [`server/README.md`](./server/README.md#environment-variables).

### 4. Configure the client

```bash
cd ../client
cp .env.example .env.local   # or create it manually — see client/README.md
npm install
```

At minimum, set `NEXT_PUBLIC_SERVER_URL=http://localhost:3001/api/v1` and
`NEXT_PUBLIC_SOCKET_SERVER_URI=http://localhost:3001`. Full variable list:
[`client/README.md`](./client/README.md#environment-variables).

### 5. Run both apps (two terminals)

```bash
# Terminal 1
cd server && npm run dev      # http://localhost:3001

# Terminal 2
cd client && npm run dev      # http://localhost:3000
```

### 6. Open the app

Visit **http://localhost:3000**. You should see the landing page render (hero,
featured courses grid — empty until you create a course, FAQ).

## Verifying Your Setup

Run these quick checks after step 5:

```bash
# API health check
curl http://localhost:3001/test
# → {"success":true,"message":"Backend in running"}

# Public course list (should return an empty array before you create any courses)
curl http://localhost:3001/api/v1/course/all
```

If both return valid JSON, the server, MongoDB, and Redis are all wired up correctly.

## Creating Your First Admin User

The admin dashboard (`/admin/*`) requires a user with `role: "admin"`. New
registrations always default to `role: "user"`, so promote yourself manually after
signing up once through the UI:

```js
// mongosh (or MongoDB Compass) against your MONGO_URI database
db.users.updateOne(
  { email: "you@example.com" },
  { $set: { role: "admin" } }
)
```

Log out and back in (or refresh) afterward so the client picks up the updated role.

## Troubleshooting

| Symptom | Likely Cause | Fix |
|---|---|---|
| Server crashes on boot with `Redix connection failed` | `REDIS_URL` not set / Redis not running | Start Redis and confirm `REDIS_URL` in `server/.env` |
| Server exits with `MONGO_URI is required outside development` | `NODE_ENV` isn't `development` and `MONGO_URI` is unset | Set `MONGO_URI`, or run with `NODE_ENV=development` locally |
| Client requests fail with a CORS error in the browser console | The client's origin isn't in the server's `FRONTEND_URLS` allowlist | Add `http://localhost:3000` (or your dev URL) to `FRONTEND_URLS` in `server/.env` |
| Login "succeeds" but you're immediately logged out on refresh | Cookies aren't round-tripping — usually a mismatched `NEXT_PUBLIC_SERVER_URL` (must be reachable from the browser) or a CORS/credentials misconfiguration | Confirm `NEXT_PUBLIC_SERVER_URL` points at the running server and that CORS `credentials: true` matches (already configured in `app.ts` — just verify the origin allowlist) |
| Purchasing a course fails with `Stripe is not configured on the server` | `STRIPE_SECRET_KEY` missing | Add your Stripe **test** secret key to `server/.env` |
| Course thumbnail / avatar upload fails silently | Cloudinary env vars missing or incorrect | Double-check `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` |
| Lesson video player never loads | `VDOCIPHER_API_SECRET` missing, or the `videoUrl` entered on the lesson isn't a real VdoCipher video ID | See [Known Gaps](#known-gaps--roadmap) — video upload isn't wired up yet, so this field expects a pre-existing VdoCipher video ID |
| Social login redirects to an error page | OAuth app's redirect URI doesn't match, or `NEXTAUTH_SECRET` is unset | Set the redirect URIs exactly as `http://localhost:3000/api/auth/callback/<provider>`, and set `NEXTAUTH_SECRET` to any random string |
| Emails (activation code / order confirmation) never arrive | SMTP credentials wrong, or using a Gmail account without an App Password | Generate a Gmail App Password (2FA must be enabled) and use that as `SMTP_PASSWORD` |

## Engineering Notes

A few deliberate design decisions worth calling out for anyone reviewing this codebase:

- **Token rotation, not long-lived sessions.** Access tokens are short-lived (2h
  default); a refresh token (24h default) plus a Redis-backed session record lets
  `updateAccessToken` silently rotate both on every protected request, so a stolen
  access token has a narrow blast radius without forcing constant re-logins.
- **Server-computed pricing.** The client never sends a price to the payment endpoint —
  `newPayment` looks up the course server-side and computes the Stripe amount from the
  authoritative record, closing an obvious tampering vector.
- **Sanitized public reads.** Public course endpoints strip `videoUrl`,
  `questions`, `links`, and `suggestion` from `courseData` via a Mongoose `.select()`
  projection, so lesson content is only ever served to users who own the course.
- **Cache invalidation on write.** `updatePublicCourseCache` re-populates and re-caches
  the sanitized course document in Redis after every mutation that affects it (edits,
  new questions/answers, new reviews/replies), rather than caching indefinitely and
  hoping for the best.
- **Normalized error handling on both ends.** The server routes every thrown error
  through a single `errorMiddleware` that maps Mongoose/JWT error classes to consistent
  HTTP responses; the client mirrors this with `getErrorMessage()`, which normalizes the
  several distinct error shapes RTK Query can produce (server body, network failure,
  timeout, bad JSON, bare status code) into one user-facing string.
- **Defense in depth on admin routes.** Admin pages are guarded twice: client-side by
  `adminProtected.tsx` (redirects non-admins away before rendering), and server-side by
  `authorizeRoles("admin")` on every admin route — the client guard is a UX nicety, not
  the security boundary.

## Known Gaps / Roadmap

Being upfront about the current limitations:

- **Video upload isn't implemented.** Lesson video fields are plain text inputs for a
  VdoCipher video ID/URL — there's no in-app upload pipeline yet. Playback (streaming
  via VdoCipher OTP) does work once a valid video ID is entered.
- **No automated tests** currently ship with either app.
- **No CI/CD pipeline** is configured in this repository.
- **No database seed script** — the first admin user must be promoted manually (see
  above).

Contributions/PRs addressing any of the above are welcome.

## License

MIT — see individual package.json files for the declared license per app.