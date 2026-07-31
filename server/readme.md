# Server — ELearning LMS API

![Node.js](https://img.shields.io/badge/Node.js-≥20.9-339933?logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-5-black?logo=express)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose_9-47A248?logo=mongodb&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-ioredis-DC382D?logo=redis&logoColor=white)

The API server for the ELearning LMS: authentication, course/order/layout CRUD, video
OTP generation, analytics, and real-time notifications. Express 5 + TypeScript, running
as native ESM against MongoDB (Mongoose) and Redis.

> Looking for the one-command "get everything running" guide? Start at the
> [root README](../README.md#getting-started-local-development) — this document is the
> deep dive on the API itself.

## Table of Contents

- [Tech Stack](#tech-stack)
- [Folder Structure](#folder-structure)
- [Prerequisites](#prerequisites)
- [Setup](#setup)
- [Environment Variables](#environment-variables)
- [Scripts](#scripts)
- [Running & Verifying](#running--verifying)
- [API Reference](#api-reference)
- [Data Models](#data-models)
- [Auth & Session Design](#auth--session-design)
- [Caching Strategy](#caching-strategy)
- [Real-time Notifications](#real-time-notifications)
- [Error Handling](#error-handling)
- [Troubleshooting](#troubleshooting)

## Tech Stack

- **Runtime**: Node.js, TypeScript, native ESM (`"type": "module"`, `NodeNext` resolution)
- **Framework**: Express 5
- **Database**: MongoDB via Mongoose 9
- **Cache/session store**: Redis via `ioredis`
- **Auth**: JSON Web Tokens (short-lived access + rotating refresh), bcryptjs password hashing
- **Media storage**: Cloudinary (course thumbnails, avatars, hero banner images)
- **Payments**: Stripe (PaymentIntents API)
- **Video**: VdoCipher OTP generation for secure playback
- **Email**: Nodemailer + EJS templates
- **Realtime**: Socket.IO
- **Scheduled jobs**: node-cron (purges read notifications older than 30 days, daily at midnight)

## Folder Structure

```
server/
└── src/
    ├── @types/            # Ambient type augmentation (Express Request.user)
    ├── config/            # env.ts, database.ts, redis.ts, cloudinary.ts
    ├── controllers/       # course, order, user, layout, analytics, notification
    ├── mails/             # EJS email templates (activation, order confirmation, question reply)
    ├── middlewares/       # auth.ts, error.ts, catchAsyncError.ts
    ├── models/             # User, Course, Order, Layout, Notification (Mongoose schemas)
    ├── routes/             # Express routers, mounted under /api/v1
    ├── utils/              # ErrorHandler, jwt.ts, sendEmail.ts, analytics.generator.ts
    ├── app.ts              # Express app: CORS, body parser, route mounting, error middleware
    ├── server.ts           # HTTP server bootstrap: connects DB, starts sockets, listens
    └── socketServer.ts     # Socket.IO notification relay
```

## Prerequisites

- Node.js ≥ 20.9
- A running MongoDB instance (local, Docker, or Atlas)
- A running Redis instance (local, Docker, or a managed provider)
- (Optional, for full functionality) Cloudinary, Stripe, VdoCipher, and SMTP credentials

## Setup

```bash
cd server
npm install
```

Create a `.env` file (see [Environment Variables](#environment-variables) below), then:

```bash
npm run dev
```

You should see:

```
Redis connected
Connected to MongoDB
Server is running on port 3001
```

## Environment Variables

```ini
# App
NODE_ENV=development
PORT=3001
FRONTEND_URLS=http://localhost:3000        # comma-separated allowed CORS origins

# MongoDB
MONGO_URI=mongodb://localhost:27017/learning-management-system

# Redis
REDIS_URL=redis://localhost:6379

# JWT
ACCESS_TOKEN=some_access_token_secret
REFRESH_TOKEN=some_refresh_token_secret
ACCESS_TOKEN_EXPIRE=2                       # hours
REFRESH_TOKEN_EXPIRE=24                     # hours
ACTIVATION_SECRET=some_activation_secret
JWT_EXPIRE=5                                # minutes (activation code TTL)

# Cloudinary
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

# Stripe (use TEST keys locally — never commit live keys)
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...       # from `stripe listen` locally, or the Dashboard webhook endpoint in production

# VdoCipher
VDOCIPHER_API_SECRET=...

# SMTP (order/activation emails)
SMPT_HOST=smtp.example.com
SMPT_PORT=587
SMTP_SERVICE=gmail
SMTP_MAIL=you@example.com
SMTP_PASSWORD=app_password
```

Notes:
- `MONGO_URI` is **required** whenever `NODE_ENV !== "development"` (enforced in
  `src/config/env.ts`); in development it falls back to a local Mongo instance if unset.
- `FRONTEND_URLS` supports multiple comma-separated origins (e.g. a deployed client
  URL alongside `localhost`) — anything not in this list is rejected by the CORS
  middleware in `app.ts`.
- `STRIPE_WEBHOOK_SECRET` is required for `/api/v1/order/webhook` to accept events.
  Locally, run `stripe listen --forward-to localhost:3001/api/v1/order/webhook` and
  use the `whsec_...` value it prints. In production, create a webhook endpoint in the
  Stripe Dashboard pointed at `<your-api-domain>/api/v1/order/webhook` subscribed to
  `payment_intent.succeeded`, and use the signing secret it generates.
- Never commit a real `.env` file. Treat every secret above as sensitive, including in
  local development — use test/sandbox credentials wherever the provider offers them.

## Scripts

```bash
npm run dev     # tsx watch src/server.ts — hot-reloading dev server
npm run build   # tsc — compiles to dist/
npm run start   # node dist/server.js — run the compiled build
```

## Running & Verifying

```bash
npm run dev
```

```bash
curl http://localhost:3001/test
# → {"success":true,"message":"Backend in running"}

curl http://localhost:3001/api/v1/course/all
# → {"success":true,"courses":[]}
```

## API Reference

All routes are mounted under `/api/v1`. Admin/protected routes chain
`updateAccessToken` (silent token refresh) → `isAuthenticated` (verifies the session in
Redis) → `authorizeRoles("admin")` where applicable.

### `/user`
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/register` | — | Register + send activation email |
| POST | `/activate` | — | Activate account with 4-digit code |
| POST | `/login` | — | Email/password login |
| GET | `/logout` | user | Clear cookies + Redis session |
| GET | `/refreshtoken` | — | Rotate access/refresh tokens |
| GET | `/me` | user | Current user |
| POST | `/social-auth` | — | Create/login via Google/GitHub profile |
| PATCH | `/me/update` | user | Update name/email |
| PUT | `/password/update` | user | Change password |
| PUT | `/me/update/profile-picture` | user | Update avatar (Cloudinary) |
| GET | `/admin/all` | admin | List all users |
| PUT | `/admin/update-role` | admin | Change a user's role |
| DELETE | `/admin/delete` | admin | Delete a user |

### `/course`
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/admin/create` | admin | Create course + upload thumbnail |
| PATCH | `/admin/edit/:id` | admin | Edit course, re-upload thumbnail if changed |
| GET | `/all` | — | Public course list (video/question fields stripped) |
| GET | `/get/:id` | — | Public single course (Redis-cached, sanitized) |
| GET | `/get/user/:id` | user | Full course content for an enrolled user/admin |
| PUT | `/add-question` | user | Add a Q&A question to a lesson |
| PUT | `/add-answer` | user | Reply to a question |
| PUT | `/add-review/:id` | user | Add a course review (purchasers only) |
| PUT | `/admin/add-review-reply` | admin | Admin reply to a review |
| GET | `/admin/all` | admin | Full course list |
| POST | `/getVdoCipherOTP` | — | Get VdoCipher OTP + playbackInfo for a videoId |
| DELETE | `/admin/delete` | admin | Delete a course |

### `/order`
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/create` | user | Verify a completed Stripe payment and fulfill enrollment (client-confirmed path) |
| GET | `/admin/all` | admin | List all orders |
| GET | `/payment/stripePublishAbleKey` | — | Get the Stripe publishable key |
| POST | `/payment/process` | user | Create a Stripe PaymentIntent for a course |
| POST | `/webhook` | Stripe signature | Authoritative, idempotent order fulfillment on `payment_intent.succeeded` |

### `/layout`
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/admin/create` | admin | Create Banner/FAQ/Categories layout doc |
| PUT | `/admin/edit` | admin | Edit Banner/FAQ/Categories layout doc |
| GET | `/get/:type` | — | Public fetch of a layout doc by type |

### `/notification`
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/admin/all` | admin | List notifications |
| PATCH | `/admin/:id/status-update` | admin | Mark a notification read/unread |

### `/analytic`
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/admin/user-analytics` | admin | Last 12 months of user signups |
| GET | `/admin/course-analytics` | admin | Last 12 months of course creation |
| GET | `/admin/order-analytics` | admin | Last 12 months of orders |

### Misc
- `GET /test` — health check (no auth, no DB dependency).

## Data Models

- **User** — name, email, password (bcrypt-hashed, `select: false`), avatar, role
  (`"user"` | `"admin"`, default `"user"`), `isVerified`, `courses: [{ courseId }]`.
- **Course** — name, description, categories (string, matched against Layout
  categories), price/estimatedPrice, thumbnail, tags, level, demoUrl, benefits,
  prerequisites, `reviews[]` (rating, review text, nested `reviewReplies`),
  `courseData[]` (lessons: title, description, videoUrl, videoSection, videoLength,
  links, nested `questions`/`questionReplies`), rating, purchased count.
- **Order** — userId, courseId, paymentInfo, `paymentIntentId` (unique, sparse — the
  Stripe PaymentIntent id this order was fulfilled from; enforces that a given payment
  can only ever produce one order, regardless of how many times fulfillment is triggered).
- **Layout** — one collection, `type` discriminates between `banner` (hero image/title/
  subtitle), `faq` (question/answer list), and `categories` (title list).
- **Notification** — userId, title, message, status (`"unread"` | `"read"`); a daily
  cron job deletes read notifications older than 30 days.

## Auth & Session Design

- Passwords are hashed with bcrypt in a Mongoose `pre("save")` hook, only when the
  password field was modified.
- On login/registration, `sendToken` issues a short-lived **access token** and a
  longer-lived **refresh token**, sets them as httpOnly cookies, and stores the
  serialized user in Redis keyed by user ID with a TTL matching the refresh window.
- `updateAccessToken` runs ahead of `isAuthenticated` on every protected route: it
  verifies the refresh token, confirms a live Redis session, and **rotates both tokens**
  on every request — so a compromised access token has a short window of validity, and
  a revoked session (deleted from Redis) invalidates all outstanding tokens immediately.
- `authorizeRoles("admin")` gates admin-only routes on top of `isAuthenticated`. This is
  the actual security boundary — the client's route guards are UX only.

## Caching Strategy

Public course reads (`getSingleCourseWithoutPurchase`) are cached in Redis for 7 days
(`EX 604800`) as a fully sanitized document (video URLs, questions, links, and
suggestions excluded via a Mongoose `.select()` projection). Any mutation that changes a
course's public-facing content — edits, new questions, new answers, new reviews, new
review replies — calls `updatePublicCourseCache` to re-fetch and re-cache the sanitized
document, so the cache never serves stale data after an admin/user action.

## Payments & Fulfillment

- `POST /order/payment/process` creates a Stripe PaymentIntent with a server-computed
  `amount` (derived from the course's current price, never trusted from the client) and
  stamps `metadata.courseId`/`metadata.userId` onto it from the authenticated request.
- After the client confirms payment with Stripe, `POST /order/create` independently
  re-verifies the PaymentIntent against Stripe's API (status, amount, and metadata match)
  before fulfilling the order — it never trusts client-side confirmation alone.
- `POST /order/webhook` is the authoritative fulfillment path: Stripe calls it directly
  and its signature is verified against `STRIPE_WEBHOOK_SECRET` before any event data is
  trusted. On `payment_intent.succeeded` it fulfills the order the same way as the
  client-confirmed path, so purchases are still completed even if the browser never
  calls back (closed tab, network failure, etc.).
- Both paths share one fulfillment routine keyed by the Stripe PaymentIntent id
  (`Order.paymentIntentId`, unique+sparse), so redelivered webhook events or overlap
  between the two paths can never create duplicate orders, duplicate enrollments,
  duplicate notifications, or duplicate confirmation emails.

## Real-time Notifications

`socketServer.ts` runs a single Socket.IO namespace: any connected client can emit
`"notification"`, and the server broadcasts it to **all** connected clients as
`"newNotification"`. The admin `DashboardHeader` on the client listens for this event to
refetch the notification list and play a sound. Controllers also persist a
`NotificationModel` document for durability/history (e.g., new question, new question
reply, new review) independent of whether an admin is online to receive the socket
event.

## Error Handling

Every controller is wrapped in `catchAsyncError`, which forwards thrown/rejected errors
to Express's `next()`. A single `errorMiddleware` (`src/middlewares/error.ts`) then
normalizes:
- Mongoose `CastError` → 400 with a friendly "resource not found" message
- Mongoose duplicate-key errors (code `11000`) → 400 naming the duplicated field
- `JsonWebTokenError` / `TokenExpiredError` → 400 prompting re-authentication

...into a consistent `{ success: false, message }` JSON response, so the client's
`getErrorMessage()` helper only ever has to reason about one error shape from the API
layer (versus the several raw shapes RTK Query itself can produce for network failures).

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `Redix connection failed` on boot | `REDIS_URL` unset or Redis not reachable | Start Redis / fix `REDIS_URL` |
| `MONGO_URI is required outside development` | Running with `NODE_ENV` ≠ `development` and no `MONGO_URI` | Set `MONGO_URI` |
| `CORS origin is not allowed` in the client console | Client origin missing from `FRONTEND_URLS` | Add it (comma-separated) |
| `Stripe is not configured on the server` on checkout | `STRIPE_SECRET_KEY` unset | Add your Stripe test secret key |
| `Webhook is not configured on the server` | `STRIPE_WEBHOOK_SECRET` unset | Add the signing secret from `stripe listen` (dev) or the Dashboard webhook endpoint (prod) |
| Webhook requests return `Invalid webhook signature` | Wrong `STRIPE_WEBHOOK_SECRET`, or a proxy/CDN re-encoding the request body | Verify the secret matches the endpoint that sent the event; ensure nothing in front of the API rewrites the raw body |
| Cloudinary uploads fail | Missing/incorrect `CLOUDINARY_*` vars | Recheck credentials in the Cloudinary dashboard |
| Emails never send | Wrong SMTP creds, or Gmail without an App Password | Use a Gmail App Password (requires 2FA enabled) |