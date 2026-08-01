# Client — ELearning LMS Web App

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![Redux Toolkit](https://img.shields.io/badge/State-Redux_Toolkit-764ABC?logo=redux&logoColor=white)
![Tailwind](https://img.shields.io/badge/CSS-Tailwind_4-06B6D4?logo=tailwindcss&logoColor=white)
![Stripe](https://img.shields.io/badge/Payments-Stripe.js-635BFF?logo=stripe&logoColor=white)

The Next.js 16 (App Router) frontend for the ELearning LMS. Handles course discovery
and purchase, enrolled-course playback with Q&A/reviews, and a full admin dashboard for
course/user/content management — all backed by Redux Toolkit + RTK Query talking to the
[Express API](../server/README.md).

> Looking for the one-command "get everything running" guide? Start at the
> [root README](../README.md#getting-started-local-development) — this document is the
> deep dive on the frontend itself.

## Table of Contents

- [Tech Stack](#tech-stack)
- [Folder Structure](#folder-structure)
- [Prerequisites](#prerequisites)
- [Setup](#setup)
- [Environment Variables](#environment-variables)
- [OAuth App Setup (optional)](#oauth-app-setup-optional)
- [Scripts](#scripts)
- [Running & Verifying](#running--verifying)
- [Auth Flow](#auth-flow)
- [Key Feature Areas](#key-feature-areas)
- [State Management Conventions](#state-management-conventions)
- [Error Handling Convention](#error-handling-convention)
- [Troubleshooting](#troubleshooting)

## Tech Stack

- Next.js 16 (App Router), React 19, TypeScript
- Redux Toolkit + RTK Query (`redux/features/**/*Api.ts`)
- NextAuth 4 (Google + GitHub providers), bridged into Redux auth state
- Tailwind CSS 4 (custom breakpoints like `800px`/`1500px` in `tailwind.config.ts`)
- MUI + MUI X DataGrid (admin tables: courses, users, invoices)
- Recharts (analytics charts)
- Stripe.js / React Stripe.js (checkout)
- Socket.IO client (admin notifications)
- Formik + Yup (auth forms)
- react-hot-toast (toasts), react-pro-sidebar (admin sidebar)

## Folder Structure

```
client/
├── app/ # App Router pages + UI
│ ├── admin/ # Admin-only routes: courses, users, analytics, customization…
│ ├── components/ # Feature components (Auth, Courses, Payment, Admin, Route, Profile…)
│ ├── course/[id]/ # Public course detail page
│ ├── course-access/[id]/ # Enrolled course content viewer (protected)
│ ├── courses/ # Course catalog/search page
│ ├── hooks/ # useAuth, useProtected, useAdminProtected
│ ├── utils/ # Heading, NavItems, Ratings, CoursePlayer, ThemeSwitcher, CustomModal…
│ ├── styles/ # Shared Tailwind class strings
│ ├── layout.tsx / Provider.tsx / globals.css
│ └── page.tsx # Landing page
├── pages/ # Legacy Pages Router — NextAuth route only
│ ├── api/auth/[...nextauth].ts
│ └── _app.tsx
├── redux/
│ ├── store.ts # Store setup; boots refreshToken + loadUser on load
│ └── features/
│ ├── api/apiSlice.ts # Base RTK Query slice (refreshToken, loadUser)
│ ├── auth/ # authSlice (localStorage-persisted) + authApi
│ ├── courses/ # courseApi
│ ├── orders/ # orderApi (Stripe key, payment intent, create order)
│ ├── layout/ # layoutApi (banner/FAQ/categories)
│ ├── user/ # userApi (profile, admin user management)
│ ├── notifications/ # notificationsApi
│ └── analytics/ # analyticsApi
├── public/assets/ # Static images
├── next.config.ts # Next Image remote patterns (Cloudinary, randomuser.me)
├── tailwind.config.ts
└── AGENTS.md / CLAUDE.md # Repo-specific agent instructions
```

## Prerequisites

- Node.js ≥ 20.9
- The [server](../server/README.md) running and reachable (locally or deployed)
- (Optional, for social login) Google and/or GitHub OAuth apps

## Setup

```bash
cd client
npm install
```

Create `.env.local` (see below), then:

```bash
npm run dev
```

## Environment Variables

```ini
# Backend API + sockets
NEXT_PUBLIC_SERVER_URL=http://localhost:3001/api/v1
NEXT_PUBLIC_SOCKET_SERVER_URI=http://localhost:3001

# Public site URL — used to build absolute Open Graph / Twitter Card URLs
# (metadataBase in app/layout.tsx) so shared links render a proper preview
# (image, title, description) on WhatsApp/LinkedIn/Facebook/Telegram/
# Discord/Slack/X. Defaults to http://localhost:3000 if unset; set this to
# the real deployed origin (e.g. https://elearning.example.com) in production.
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# NextAuth
NEXTAUTH_SECRET=some_random_secret
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
```

`NEXT_PUBLIC_*` variables are inlined into the client bundle at build time — only put
non-secret, browser-safe values there. `NEXTAUTH_SECRET` and the OAuth client secrets
stay server-side within Next.js's own API routes and are never exposed to the browser.

## OAuth App Setup (optional)

Social login isn't required to run the app — email/password registration works without
any OAuth configuration. If you want to test it:

1. **Google**: [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
   → create an OAuth 2.0 Client ID (Web application) → add authorized redirect URI
   `http://localhost:3000/api/auth/callback/google`.
2. **GitHub**: [GitHub Developer Settings](https://github.com/settings/developers) →
   New OAuth App → set the callback URL to
   `http://localhost:3000/api/auth/callback/github`.
3. Copy the generated client ID/secret pairs into `.env.local`.

## Scripts

```bash
npm run dev     # next dev
npm run build   # next build
npm run start   # next start
npm run lint    # eslint
```

## Running & Verifying

With the [server](../server/README.md) already running:

```bash
npm run dev
```

Open **http://localhost:3000**. The header, hero section, and FAQ should render
immediately; the courses grid will be empty until an admin creates a course. Try
registering a test account to confirm the client ↔ server connection end-to-end
(you should receive an activation-code email if SMTP is configured, or you can read the
code back from the server logs/DB during local testing).

## Auth Flow

1. **Email/password**: `SignUp` → `POST /user/register` → activation token stored in
   Redux → `Verification` (4-digit OTP) → `POST /user/activate` → `Login` →
   `POST /user/login` sets `accessToken` + `user` in `authSlice` (persisted to
   `localStorage` so a refresh doesn't lose the session before the API responds).
2. **Social login**: NextAuth (`pages/api/auth/[...nextauth].ts`) handles the OAuth
   handshake; `Header.tsx` detects a NextAuth session without a matching Redux user and
   calls `/user/social-auth` to create/log in the backend user, then syncs Redux state.
3. **Session bootstrap**: `redux/store.ts` dispatches `refreshToken` then `loadUser` on
   app load so a returning user is silently re-authenticated without a visible flash of
   logged-out UI.
4. **Route protection**: `hooks/useProtected.tsx` (any logged-in user) and
   `hooks/adminProtected.tsx` (role === `"admin"`) wrap protected pages and redirect to
   `/` otherwise. This is a UX convenience — the server independently enforces the same
   rules on every request.

## Key Feature Areas

- **Course browsing** (`app/courses`, `components/Route/Courses.tsx`,
  `components/Courses/CourseCard.tsx`) — category filter chips sourced from the Layout
  "Categories" doc, title search via the `?title=` query param.
- **Course detail & checkout** (`components/Courses/CourseDetails.tsx`,
  `components/Payment/CheckOutForm.tsx`) — Stripe Elements modal, PaymentIntent created
  server-side from the course price (never client-supplied), order created after
  `stripe.confirmPayment` succeeds, local Redux user state updated with the new course
  immediately so the "Enter to Course" CTA appears without waiting on a full re-fetch.
- **Enrolled course player** (`app/course-access/[id]`,
  `components/Courses/CourseContent*.tsx`, `utils/CoursePlayer.tsx`) — fetches full
  lesson content (video URLs included) only for purchasers/admins; playback goes through
  VdoCipher OTP; tabs for Overview/Resources/Q&A/Reviews.
- **Admin course builder** (`components/Admin/Course/CreateCourse.tsx`,
  `EditCourse.tsx`) — 4-step wizard: Course Information → Benefits/Prerequisites →
  Course Content (lessons/sections/links) → Preview & Submit.
- **Admin management** (`components/Admin/Users/AllUsers.tsx`,
  `components/Admin/Course/AllCourses.tsx`, `components/Admin/Customization/*`) — MUI
  DataGrid tables with edit/delete actions, a role-management modal, and category/FAQ/
  hero editors that PATCH the Layout API.
- **Admin analytics** (`components/Admin/Analytics/*`,
  `Widgets/DashboardWidgets.tsx`) — Recharts area/line/bar charts over the
  last-12-months aggregation endpoints, plus a recent-invoices table and
  month-over-month percentage-change widgets.
- **Notifications** (`components/Admin/DashboardHeader.tsx`) — polls
  `/notification/admin/all`, plays a sound and refetches on incoming Socket.IO
  `newNotification` events, lets admins mark notifications as read.

## State Management Conventions

- **RTK Query owns all server state.** Every `*Api.ts` slice under `redux/features/`
  injects endpoints into a single `apiSlice`, giving the app one shared cache, one
  loading/error model, and automatic request de-duplication — components consume it via
  generated hooks (`useGetAllCourseQuery`, `useCreateOrderMutation`, etc.) rather than
  hand-rolled `useEffect`/`fetch` calls.
- **Container/Presenter split for complex admin components.** Larger admin components
  (`AllCourses`, `AllUsers`, `EditHero`, `EditFaq`, `EditCategories`, `CourseCard`) are
  split into a "presenter" (pure render, typed props, no data fetching) and a
  "container" (owns the query/mutation hooks and local UI state) — this keeps the
  MUI DataGrid styling/markup testable in isolation from the data-fetching logic.
- **`authSlice` is the single source of truth for the logged-in user**, persisted to
  `localStorage` so the UI doesn't flash "logged out" while `loadUser` resolves after a
  hard refresh.

## Error Handling Convention

`app/utils/getErrorMessage.tsx` normalizes RTK Query's several distinct error shapes —
a server error body (`{status, data:{message}}`), network/CORS failures
(`FETCH_ERROR`), timeouts, unparsable responses, and bare HTTP status codes — into a
single human-readable string, used consistently in `toast.error(...)` calls throughout
the app instead of every call site re-implementing its own fallback logic.

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| Every API call fails with a network/CORS error | Server not running, or `NEXT_PUBLIC_SERVER_URL` wrong | Confirm the server is up and the URL includes `/api/v1` |
| Logged in, then logged out on refresh | Server unreachable during `loadUser`/`refreshToken` bootstrap, or CORS `credentials` mismatch | Check the Network tab for the `/user/refreshtoken` call and its response |
| "Buy Now" button does nothing / errors | Stripe publishable key not returned (server misconfigured) | Confirm `STRIPE_PUBLISHABLE_KEY`/`STRIPE_SECRET_KEY` are set on the server |
| Social login redirects to an error page | Redirect URI mismatch or missing `NEXTAUTH_SECRET` | Recheck the OAuth app's callback URL and `.env.local` |
| Course thumbnails/avatars don't load | Cloudinary domain missing from `next.config.ts` `images.remotePatterns`, or upload failed server-side | Confirm the Cloudinary hostname is allow-listed and the server logs show a successful upload |
| Shared link preview (WhatsApp/LinkedIn/etc.) shows no image or the wrong URL | `NEXT_PUBLIC_SITE_URL` unset or wrong in the deployed environment, so Open Graph image/URL metadata resolves against the wrong origin | Set `NEXT_PUBLIC_SITE_URL` to the real deployed origin and rebuild/redeploy, then re-scrape the link with the platform's debugger (e.g. Facebook Sharing Debugger, LinkedIn Post Inspector) |