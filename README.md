# SmartLink AI - Full-Stack URL Shortener & Click Analytics

A production-oriented full-stack URL shortener and click analytics platform built for an internship assignment. SmartLink AI prioritizes correctness, security, rigorous automated testing, and strict separation of concerns over purely visual effects.

- **Assignment Target Deadline**: October 29, 2026
- **Architecture**: Separated Express REST API + React SPA with shared typed contracts
- **Database & Auth**: Supabase PostgreSQL with Row Level Security (RLS) & backend JWT verification
- **Analytics & Visualizations**: Recharts time-series and breakdown charts with `ua-parser-js`
- **Testing**: 44 automated tests covering validation, collision handling, expiry, auth, rate limiting, and analytics

---

## 1. Feature Checklist

### Completed Core Features
- [x] **Backend API Ownership**: Express API owns all URL creation, validation, collision checks, persistence, redirection, and telemetry.
- [x] **Architectural Separation**: Clean boundaries between backend API (`apps/api`), frontend client (`src`), and typed contracts (`packages/shared`).
- [x] **Strict Scheme Validation**: Rejects non-HTTP/HTTPS schemes (e.g. `javascript:`, `data:`, `ftp:`) to prevent XSS.
- [x] **Custom Aliases & Auto-Generation**: Supports custom vanity slugs (`^[a-zA-Z0-9_-]{3,32}$`) with duplicate detection (`409 Conflict`), or auto-generates 7-character base62 slugs.
- [x] **Expiration & Status Toggling**: Supports optional future expiry timestamps (`expiresAt`) and link active/disabled toggling with `410 Gone` routing.
- [x] **Ownership & Authorization**: Independent backend verification of Supabase access tokens. Discards client-supplied `user_id` values to prevent spoofing. Cross-user access returns `403 Forbidden`.
- [x] **Per-User Rate Limiting**: Server-side sliding rate limiter restricting authenticated users to 10 link creations per 60 seconds (`429 Too Many Requests` with `Retry-After`).
- [x] **Low-Latency Redirection**: Issues `302 Found` redirects immediately without waiting for database writes. Records telemetry asynchronously with explicit error catching.
- [x] **Enriched Telemetry**: User-agent parsing via `ua-parser-js` (device, browser, OS), referrer domain extraction, and salted SHA-256 IP hashing for privacy/GDPR compliance.
- [x] **Interactive Dashboard & Recharts**: Clicks-over-time area chart, top traffic channels, device/browser distribution, live recent click logs, and clean empty states.
- [x] **Idempotent Database Migration**: Complete PostgreSQL schema with check constraints, foreign keys, cascade deletes, automated triggers, and RLS policies.
- [x] **Automated Integration Tests**: 44 Vitest and Supertest tests verifying all endpoints and security policies.

### Known Limitations
- Geolocation resolution (`country`, `city`) in the demo environment relies on IP headers or defaults to empty/unconfigured; in a cloud deployment behind Cloudflare or CloudFront, `CF-IPCountry` or MaxMind GeoIP would enrich geographic fields automatically.
- Per-user rate limiting currently uses an in-memory sliding window; for multi-instance horizontal scaling, a Redis store (e.g. Upstash Redis) would be used.

### Future Improvements
- Multi-domain / custom domain support for brand-specific vanity short links.
- QR code generation and SVG export for physical print campaigns.
- Exporting raw analytics to CSV/JSON format.
- Optional AI-assisted link tagging and destination page title summarization (Phase 4).

---

## 2. Architecture & Data Model

### Directory Structure
```text
.
├── .env.example                       # Complete placeholder environment template
├── .gitignore                         # Git exclusion rules
├── index.html                         # HTML entry with metadata, SEO, and web typography
├── metadata.json                      # AI Studio application metadata
├── package.json                       # Scripts (dev, dev:api, test, audit, seed, build)
├── README.md                          # Project documentation and submission report
├── server.ts                          # Express full-stack runner mounting Vite middlewares (port 3000)
├── tsconfig.json                      # Path aliases (@/*, @shared/*, @api/*) & TS config
├── vite.config.ts                     # Bundler config with path mapping
│
├── apps/
│   └── api/                           # Separately testable Express & Node.js backend
│       └── src/
│           ├── app.ts                 # Express application factory, CORS, routes & error handling
│           ├── standalone.ts          # Standalone runner for independent backend execution
│           ├── controllers/
│           │   ├── analytics.controller.ts # Analytics endpoints (overview & per-link)
│           │   ├── link.controller.ts # LinkController (list, create, get, update, delete)
│           │   └── redirect.controller.ts # Low-latency 302 redirect & ua-parser-js telemetry
│           ├── schemas/
│           │   └── link.ts            # Strict Zod schemas for HTTP/HTTPS, alias & expiry
│           ├── middleware/
│           │   ├── auth.ts            # Independent Supabase JWT token verification
│           │   ├── rateLimit.ts       # Per-user link creation rate limiter (10 links/min)
│           │   └── error.ts           # Standardized JSON error response handler & AppError
│           ├── routes/
│           │   ├── analytics.ts       # Protected click analytics router (/api/analytics)
│           │   ├── health.ts          # GET /api/health endpoint implementation
│           │   ├── links.ts           # Protected link management router (/api/links)
│           │   ├── redirect.ts        # Public short code router (/s/:code)
│           │   └── index.ts           # Central API router
│           ├── services/
│           │   └── supabase.ts        # Supabase client, query methods & memory fallback
│           └── __tests__/
│               ├── analytics.test.ts  # Analytics, privacy isolation & UA parser tests
│               ├── link_core.test.ts  # Core shortener tests (URL validation, rate limits, expiry)
│               ├── auth_and_links.test.ts # Auth & ownership isolation tests
│               └── health.test.ts     # Health endpoint tests
│
├── packages/
│   └── shared/                        # Shared contracts between frontend and backend
│       └── src/
│           ├── index.ts               # Barrel export for shared types
│           └── types/
│               ├── api.ts             # ApiResponse<T>, HealthResponse, ApiErrorResponse
│               └── link.ts            # LinkItem, LinkAnalytics, OverviewAnalytics, BreakdownItem
│
├── scripts/
│   ├── schema.sql                     # Single-file SQL schema for Supabase SQL Editor
│   ├── seed.sql                       # Idempotent development seed SQL with demo data
│   └── seed.ts                        # TypeScript runner for database seeding (npm run seed)
│
├── supabase/
│   └── migrations/
│       └── 20261026000000_init_schema.sql # Idempotent PostgreSQL schema migration
│
└── src/                               # Frontend React Application (SPA)
    ├── api/
    │   └── client.ts                  # Typed API client with token injection & error unwrapping
    ├── components/
    │   ├── dashboard/
    │   │   ├── AnalyticsDashboard.tsx   # Recharts charts, device/browser/referrer breakdown
    │   │   ├── ArchitectureOverview.tsx # Architecture principles, pipeline & roadmap
    │   │   ├── DocumentationView.tsx    # Interactive scripts & command reference
    │   │   ├── HealthStatusCard.tsx     # Real-time /api/health inspector & JSON viewer
    │   │   ├── LinksManager.tsx         # Real-time link management, editing, toggle & copying
    │   │   └── SchemaMigrationView.tsx  # Interactive SQL viewer & Supabase setup guide
    │   ├── layout/
    │   │   ├── Sidebar.tsx            # Responsive drawer with session switcher
    │   │   └── TopBar.tsx             # Strict 3-zone header contract
    │   └── ui/
    │       └── Badge.tsx              # Unboxed zero-pill text badge component
    ├── App.tsx                        # Main application view & live health polling
    ├── index.css                      # Tailwind CSS v4 styling & typography
    └── main.tsx                       # React 19 bootstrap entry
```

### PostgreSQL Data Model

```sql
-- Links Table
CREATE TABLE public.links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    original_url TEXT NOT NULL,
    short_code VARCHAR(32) NOT NULL UNIQUE,
    title VARCHAR(255),
    is_enabled BOOLEAN NOT NULL DEFAULT true,
    expires_at TIMESTAMPTZ,
    click_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),

    CONSTRAINT chk_short_code_format CHECK (short_code ~ '^[a-zA-Z0-9_-]{3,32}$'),
    CONSTRAINT chk_url_length CHECK (char_length(original_url) <= 2048),
    CONSTRAINT chk_click_count_non_negative CHECK (click_count >= 0),
    CONSTRAINT chk_expiration_validity CHECK (expires_at IS NULL OR expires_at > created_at)
);

-- Click Events Table
CREATE TABLE public.click_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    link_id UUID NOT NULL REFERENCES public.links(id) ON DELETE CASCADE,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    referrer TEXT,
    user_agent TEXT,
    ip_hash VARCHAR(64),
    country VARCHAR(64),
    city VARCHAR(64),
    device VARCHAR(32) DEFAULT 'desktop',
    browser VARCHAR(32),
    os VARCHAR(32)
);
```

#### Row Level Security (RLS) Policies
- `links`:
  - `SELECT`: `auth.uid() = user_id`
  - `INSERT`: `WITH CHECK (auth.uid() = user_id)`
  - `UPDATE`: `USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)`
  - `DELETE`: `USING (auth.uid() = user_id)`
- `click_events`:
  - `SELECT`: `EXISTS (SELECT 1 FROM links WHERE links.id = click_events.link_id AND links.user_id = auth.uid())`

---

## 3. Prerequisites & Local Setup Instructions

### Prerequisites
- **Node.js**: $\ge 18.0.0$ (LTS recommended)
- **npm**: $\ge 9.0.0$
- **Supabase Account**: (Optional for local testing; the applet includes a complete in-memory fallback pre-populated with seed data so tests and the demo run immediately without third-party setup).

### Step-by-Step Setup

```bash
# 1. Clone repository
git clone <repository-url>
cd smartlink-ai

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env

# 4. Run the full-stack development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 4. Supabase Migration & Seed Instructions

### Applying the Schema Migration
1. Open your project in the [Supabase Dashboard](https://supabase.com).
2. Go to the **SQL Editor** &gt; **New query**.
3. Open `scripts/schema.sql` (or `supabase/migrations/20261026000000_init_schema.sql`), paste the contents into the editor, and click **Run**.
4. The tables `public.links` and `public.click_events` will be created with all indexes, triggers, and RLS policies.

### Seeding Demo Data
To populate demo links and realistic click events:
- **Option A (SQL Editor)**: Copy the contents of `scripts/seed.sql` and run it in the Supabase SQL Editor.
- **Option B (CLI Script)**: If `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are configured in `.env`, run:
  ```bash
  npm run seed
  ```

---

## 5. Required Environment Variables

All settings are defined in `.env.example`:

| Variable | Scope | Description | Default / Example |
| :--- | :--- | :--- | :--- |
| `PORT` | Server | Port for the Express dev/prod server | `3000` |
| `API_PORT` | Server | Optional standalone Express port | `4000` |
| `NODE_ENV` | Server | Environment mode (`development` / `production` / `test`) | `development` |
| `API_PREFIX` | Server | Base prefix for Express API routes | `/api` |
| `APP_URL` | Both | Public URL for short links and redirects | `http://localhost:3000` |
| `VITE_API_BASE_URL` | Client | Target API URL (empty defaults to same-origin) | `http://localhost:3000` |
| `SUPABASE_URL` | Both | Supabase Project URL | `https://your-project.supabase.co` |
| `VITE_SUPABASE_URL` | Client | Supabase Project URL for frontend client | `https://your-project.supabase.co` |
| `SUPABASE_ANON_KEY` | Both | Supabase Anonymous public key | `eyJhbGciOi...` |
| `VITE_SUPABASE_ANON_KEY` | Client | Supabase Anonymous public key for browser client | `eyJhbGciOi...` |
| `SUPABASE_SERVICE_ROLE_KEY`| Server | **Server-only** administrative key | `eyJhbGciOi...` |
| `SUPABASE_JWT_SECRET` | Server | **Server-only** JWT secret for token verification | `your-jwt-secret` |
| `DATABASE_URL` | Server | Direct PostgreSQL connection string | `postgresql://postgres:...` |
| `RATE_LIMIT_LINK_CREATION_MAX` | Server | Max links allowed per user per 60 seconds | `10` |

---

## 6. Development, Test & Build Commands

```bash
# Start full-stack development server (Express API + Vite React on port 3000)
npm run dev

# Run automated test suites (Vitest + Supertest, 44 tests)
npm test

# Run tests in watch mode
npm run test:watch

# Execute complete quality audit (typecheck + build + test)
npm run audit

# Run TypeScript type check
npm run lint

# Build client production bundle
npm run build

# Run Express API in standalone mode (on port 4000)
npm run dev:api

# Populate database with demo records
npm run seed
```

---

## 7. API Endpoint Documentation

All protected endpoints require an `Authorization: Bearer <token>` header.

### 1. Health Check
`GET /api/health`
- **Auth**: None
- **Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "service": "smartlink-ai-api",
    "version": "1.3.0-phase3",
    "timestamp": "2026-10-26T14:40:00.000Z",
    "uptimeSeconds": 128,
    "environment": "development",
    "checks": {
      "api": "ok",
      "database": "connected",
      "auth": "ready"
    }
  }
}
```

### 2. Create Short Link
`POST /api/links`
- **Auth**: Bearer Token (Rate limited to 10 requests / 60 seconds)
- **Request Body**:
```json
{
  "originalUrl": "https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview",
  "customCode": "http-guide",
  "title": "MDN HTTP Guide",
  "expiresAt": "2026-12-31T23:59:59.000Z"
}
```
- **Response**: `201 Created`
```json
{
  "success": true,
  "data": {
    "id": "e6a21394-bb0b-4892-913a-7f61c5c6d321",
    "userId": "00000000-0000-0000-0000-000000000001",
    "originalUrl": "https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview",
    "shortCode": "http-guide",
    "shortUrl": "http://localhost:3000/s/http-guide",
    "title": "MDN HTTP Guide",
    "clickCount": 0,
    "isActive": true,
    "expiresAt": "2026-12-31T23:59:59.000Z",
    "createdAt": "2026-10-26T14:41:00.000Z",
    "updatedAt": "2026-10-26T14:41:00.000Z"
  }
}
```

### 3. List User Links
`GET /api/links`
- **Auth**: Bearer Token
- **Response**: `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "e6a21394-bb0b-4892-913a-7f61c5c6d321",
      "shortCode": "http-guide",
      "originalUrl": "https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview",
      "clickCount": 14,
      "isActive": true
    }
  ]
}
```

### 4. Update Link Destination & Status
`PATCH /api/links/:id`
- **Auth**: Bearer Token (Ownership enforced)
- **Request Body**:
```json
{
  "originalUrl": "https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers",
  "isEnabled": false
}
```
- **Response**: `200 OK`

### 5. Delete Link
`DELETE /api/links/:id`
- **Auth**: Bearer Token (Ownership enforced)
- **Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "e6a21394-bb0b-4892-913a-7f61c5c6d321",
    "deleted": true
  }
}
```

### 6. Aggregated User Analytics
`GET /api/analytics/overview`
- **Auth**: Bearer Token
- **Response**: `200 OK`

### 7. Per-Link Detailed Analytics
`GET /api/analytics/links/:id`
- **Auth**: Bearer Token (Ownership enforced)
- **Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "linkId": "e6a21394-bb0b-4892-913a-7f61c5c6d321",
    "shortCode": "http-guide",
    "totalClicks": 14,
    "uniqueVisitors": 11,
    "clicksOverTime": [
      { "date": "2026-10-20", "clicks": 2 },
      { "date": "2026-10-21", "clicks": 3 }
    ],
    "topReferrers": [
      { "name": "twitter.com", "count": 6, "percentage": 43 },
      { "name": "github.com", "count": 4, "percentage": 29 },
      { "name": "Direct", "count": 4, "percentage": 29 }
    ],
    "deviceBreakdown": [
      { "name": "desktop", "count": 8, "percentage": 57 },
      { "name": "mobile", "count": 6, "percentage": 43 }
    ],
    "browserBreakdown": [
      { "name": "Chrome", "count": 7, "percentage": 50 },
      { "name": "Safari", "count": 5, "percentage": 36 }
    ]
  }
}
```

### 8. Public Short URL Redirection
`GET /s/:code`
- **Auth**: None
- **Behavior**:
  - If active: Returns `302 Found` redirecting to `originalUrl`.
  - If disabled: Returns `410 Gone` with deactivation page.
  - If expired: Returns `410 Gone` with expiration notice.
  - If missing: Returns `404 Not Found`.

---

## 8. Authentication & Authorization Design

1. **Independent Backend Verification**:
   - The Express middleware (`apps/api/src/middleware/auth.ts`) extracts the `Bearer <token>` from the `Authorization` header.
   - The token is verified against Supabase Auth (`supabase.auth.getUser(token)`).
2. **Never Trust Client-Supplied User IDs**:
   - Any `user_id` or `userId` in the request body or query string is purged before controllers execute.
   - The user identity is taken strictly from the verified JWT: `req.user = { id, email, role }`.
3. **Cross-User Data Access Prevention**:
   - Endpoints verify `link.userId === req.user.id`. Attempts by User A to view, edit, delete, or fetch analytics for User B's link are rejected with `403 FORBIDDEN`.

---

## 9. Redirection & Analytics Event-Processing Design

```text
[Browser Client]
       │
       ▼
GET /s/:code
       │
┌──────────────────────────────────────────────┐
│ Express API (apps/api/src/controllers)       │
│ 1. Resolve link state in memory/database     │
│ 2. Check is_enabled and expires_at           │
│ 3. Send HTTP 302 Found IMMEDIATELY           │
└──────────────────────────────────────────────┘
       │
       │ (Async fire-and-forget, non-blocking)
       ▼
┌──────────────────────────────────────────────┐
│ Background Telemetry Logger                  │
│ • ua-parser-js parses Device, Browser & OS   │
│ • Salted SHA-256 IP hash for privacy         │
│ • Domain clean on Referer header             │
│ • Inserts into public.click_events table     │
│ • Trigger increments click_count on links    │
└──────────────────────────────────────────────┘
```

- **Zero Blocking**: The redirect response is never held waiting for click logging.
- **Zero AI Requests**: Redirection runs on a high-throughput deterministic code path.

---

## 10. AI Tools Used & Transparency Disclosure

- **AI Model**: Google Gemini 3.8 Flash via Google AI Studio Build assistant.
- **Role & Usage**:
  - Assisted in scaffolding initial TypeScript interfaces, Zod validation schemas, and Express routing controllers.
  - Assisted in drafting Vitest/Supertest integration test cases to ensure comprehensive scenario coverage.
  - Formatted API documentation and setup guides.
- **Human Engineering & Governance**:
  - Architecture decisions, Row Level Security policies, token verification flow, and low-latency redirect handling were explicitly audited, verified, and executed.

---

## 11. Demo Login & Evaluation Instructions

In the development environment, a working mock session switcher is provided in the left sidebar:

- **Demo User 1 (Primary)**:
  - Email: `demo.engineer@smartlink.ai`
  - Token: `demo-token-user-1`
  - Pre-seeded Links: `/s/mdn-http` (14 clicks), `/s/supa-auth` (6 clicks), `/s/vitest-docs` (2 clicks), `/s/flash-sale-expired` (expired test).
- **Demo User 2 (Collaborator)**:
  - Email: `collaborator@smartlink.ai`
  - Token: `demo-token-user-2`
  - Pre-seeded Link: `/s/team-express` (3 clicks).

Switching between sessions in the sidebar demonstrates cross-user isolation: User 1 cannot access User 2's links or click analytics.

For live Supabase deployment, users can register real accounts using Supabase Auth, and the backend verifies their tokens through `supabase.auth.getUser(token)`.
