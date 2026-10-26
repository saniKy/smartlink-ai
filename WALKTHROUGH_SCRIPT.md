# SmartLink AI - Video Walkthrough Script (3–5 Minutes)

Use this timed presentation script to record your internship assignment submission video.

---

### [0:00 – 0:45] Part 1: Introduction & Problem Statement
- **Visual**: Webcam + SmartLink AI Title Screen / Dashboard.
- **Presenter**:
  > "Hello! My name is [Your Name], and this is SmartLink AI, a full-stack, production-oriented URL shortener with real-time click telemetry and analytics built for the internship assignment.
  >
  > The primary objective was to build a system where the Express backend API owns all business logic, validates untrusted input, independently verifies Supabase authentication tokens, and captures enriched click telemetry with sub-millisecond redirection latency. Let's start with a live demo."

---

### [0:45 – 2:00] Part 2: Live Feature & Analytics Demo
- **Visual**: Screen recording of the web application in browser.
- **Presenter**:
  > "Here on the **Short URLs** dashboard, we are authenticated as `demo.engineer@smartlink.ai`.
  >
  > First, let's create a new short URL. I'll enter a destination URL: `https://developer.mozilla.org/en-US/docs/Web/HTTP` with a custom alias `http-docs`.
  > Notice the server validates that the scheme is strictly HTTP or HTTPS. If someone attempts to submit a `javascript:` or malformed URI, the backend immediately rejects it with a 400 error.
  >
  > When I click **Create SmartLink**, the link appears in our table. We can click the copy icon to copy the URL to the clipboard.
  >
  > Now, let's test redirection by opening `/s/http-docs` in a new tab. Notice how instantaneous the 302 redirect is.
  >
  > Let's look at the **Click Analytics** page. Using Recharts, we see an interactive 7-day timeline of click activity, top traffic referrers, and device/browser breakdowns.
  >
  > Back on the links table, if I toggle the status button to **Disabled**, and then attempt to visit the short URL, the server immediately returns a clean 410 Gone page explaining the link was deactivated by its owner.
  >
  > Finally, let's test cross-user isolation. In the sidebar session switcher, I'll switch to `collaborator@smartlink.ai`. Notice that User 1's private links and analytics disappear, and only User 2's links are visible. User 1 cannot view, edit, or delete User 2's data."

---

### [2:00 – 3:15] Part 3: Backend Code & Architecture Tour
- **Visual**: Code editor showing `apps/api/src/`.
- **Presenter**:
  > "Now let's examine the backend architecture.
  >
  > In `apps/api/src/app.ts`, the Express application encapsulates all business logic.
  >
  > In `apps/api/src/schemas/link.ts`, we define strict Zod validation schemas. We enforce that destinations must have an `http:` or `https:` protocol, aliases must match our regex constraint, and expiry dates must be in the future.
  >
  > In `apps/api/src/middleware/auth.ts`, we verify incoming Supabase JWT tokens via `supabase.auth.getUser()`. Notice line 72: we explicitly delete any client-supplied `user_id` from the request body. The user identity is taken exclusively from the verified token.
  >
  > In `apps/api/src/middleware/rateLimit.ts`, we enforce a sliding rate limiter allowing a maximum of 10 link creations per 60 seconds per user, returning 429 with standard `Retry-After` headers.
  >
  > And in our PostgreSQL schema (`supabase/migrations/`), we define check constraints, cascade deletes, automated triggers to increment click counts, and Row Level Security policies ensuring tenants can only access their own data."

---

### [3:15 – 4:15] Part 4: One Difficult Engineering Problem & Resolution
- **Visual**: Show `apps/api/src/controllers/redirect.controller.ts`.
- **Presenter**:
  > "One of the most challenging engineering problems was **maintaining ultra-low redirection latency while capturing rich click telemetry**.
  >
  > If a URL shortener waits for User-Agent parsing, database inserts, and IP hashing before responding, redirect latency spikes significantly—harming user experience and conversion rates.
  >
  > To solve this, in `redirect.controller.ts`, we decoupled the redirect into two phases:
  > 1. In Phase 1, we resolve the active link status in memory or database, verify it's enabled and not expired, and **immediately issue the HTTP 302 Found response**.
  > 2. In Phase 2, we execute the telemetry capture asynchronously. We parse the User-Agent using the maintained `ua-parser-js` library, normalize the referrer domain, hash the client IP with salted SHA-256 for GDPR compliance, and insert into the `click_events` table.
  >
  > Crucially, we wrap the asynchronous logger with an explicit `.catch()` handler so any background database transient failure never bubbles up or crashes the process."

---

### [4:15 – 4:45] Part 5: Automated Testing & Verification
- **Visual**: Terminal executing `npm run audit`.
- **Presenter**:
  > "Reliability was our top priority. We wrote **44 automated integration tests** using Vitest and Supertest.
  >
  > Let's run our unified audit command: `npm run audit`.
  > 1. `tsc --noEmit` runs with zero type errors.
  > 2. `vite build` builds our production client bundle.
  > 3. `vitest run` executes all 44 tests covering URL validation, alias conflicts, expiry, disabled states, user authorization, rate limiting, and telemetry parsing.
  >
  > All 44 tests pass in under 4 seconds."

---

### [4:45 – 5:00] Part 6: Conclusion
- **Visual**: Webcam + SmartLink AI Dashboard.
- **Presenter**:
  > "SmartLink AI delivers a rock-solid, production-ready foundation with strict security, low redirect latency, and complete test coverage.
  >
  > All code, documentation, and migration scripts are complete in the repository. Thank you for watching!"
