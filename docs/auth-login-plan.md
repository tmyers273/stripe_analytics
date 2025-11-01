# Login & Authentication Design

## Goals
- Provide a secure email + password login experience that covers registration and session management.
- Minimize backend changes required to add social login with Google, Facebook, and Sign in with Apple later.
- Keep the solution framework-agnostic enough to run in the existing Hono + React monorepo.
- Preserve developer ergonomics (type safety, testability) and make it easy to extend with features like MFA and audit logging.

## Scope & Assumptions
- Users access the product through the existing React frontend; there is no mobile client yet.
- Postgres (or another SQL store) backs user data, with Drizzle ORM + drizzle-kit migrations providing the data access layer.
- Email-driven flows (verification, password reset) are deferred, but we will ship a stubbed email service that logs or queues messages to prepare for a future provider (SendGrid, Postmark, Mailgun, etc.).
- We manage identity ourselves rather than integrating a hosted IdP (e.g. Auth0) for now, but the architecture keeps that option open.
- Users can belong to one or more organizations (accounts) and we need organization-scoped access control.

## Functional Requirements
- Registration with email, password, full name, and organization selection/creation.
- Users can belong to multiple organizations and switch active organization context.
- Login with email + password.
- Logout, session invalidation, and refresh.
- Account management endpoints (change password, rotate sessions, manage organization memberships).
- Social login extensibility for Google, Facebook, Apple (Sign in with Apple) without significant refactors.
- Future phase: email verification and password reset once outbound email is available.

## Non-Functional Requirements
- OWASP-compliant password handling (Argon2id hashing, minimum length, breached password check).
- Rate limiting + bot protection on auth endpoints.
- CSRF-safe session cookies, Strict-Transport-Security enforcement, and same-site cookie policy.
- Structured audit log events for critical auth actions.
- Comprehensive logging & metrics (success vs failure counts, latency).
- Strong typing (Zod schemas) across request/response and database layer.

## High-Level Architecture
```
Frontend (React)         Backend (Hono API)                 Database / Services
----------------        --------------------               --------------------
Auth Store (MobX)  <-->  Auth Router (/auth/*)  <---------> Users, Credentials,
Forms & UI (shadcn)      Session Service                    Sessions, Identities,
OAuth Provider Buttons   Organization Service               Organizations,
                         Rate Limiter (Redis)               OrganizationMembers
                         Monitoring / Logging               AuditLog
```

### Key Components
- **Auth Router**: Hono routes grouped under `/auth` handling registration, login, logout, refresh, social provider callbacks, and organization-aware context switching.
- **Session Service**: Issues HTTP-only session cookies + refresh tokens; stores session state in `sessions` table with short-lived JWT access tokens and longer-lived refresh tokens.
- **Credential Service**: Wraps hashing, password policy checks, and linking external identities.
- **Organization Service**: Manages organization creation, membership, roles, and active-organization selection per session.
- **Email Service (stub)**: Provides a unified interface for transactional emails; default implementation logs payloads while keeping provider-specific adapters pluggable.
- **Provider Integrations**: One adapter per provider sharing a common interface; uses OAuth 2.0 code flow with PKCE.
- **Persistence Layer**: Drizzle ORM models + migrations encapsulating schema and data access for auth/organization tables.

## Data Model (relational)

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `users` | Base profile | `id (uuid, pk)`, `email (unique)`, `name`, `default_organization_id (fk)`, `created_at`, `updated_at` |
| `user_credentials` | Password auth | `user_id (fk)`, `password_hash`, `password_version`, `created_at`, `updated_at` |
| `organizations` | Account container | `id (uuid, pk)`, `name`, `plan`, `created_at`, `updated_at` |
| `organization_members` | Membership join table | `organization_id (fk)`, `user_id (fk)`, `role ('owner' \| 'admin' \| 'member')`, `created_at`, `updated_at` |
| `user_identities` | External providers | `id`, `user_id (fk)`, `provider` (`'google'` etc.), `provider_user_id`, `access_token`, `refresh_token`, `scopes`, `expires_at`, `metadata (jsonb)` |
| `sessions` | Active sessions | `id (uuid)`, `user_id (fk)`, `refresh_token_hash`, `user_agent`, `ip_address`, `created_at`, `expires_at`, `revoked_at` |
| `audit_logs` | Tracking | `id`, `user_id`, `action`, `metadata`, `created_at` |

_Notes_:
- Hash refresh tokens using HMAC or Argon2 to avoid storing plaintext.
- `user_identities` allows multiple providers per user (e.g. both Google and Apple linked).
- Future email-driven features will introduce `email_verification_tokens`, `password_reset_tokens`, and optional `organization_invitations`.

## Drizzle Schema Sketch

```ts
import { pgTable, uuid, text, timestamp, pgEnum, primaryKey, index, uniqueIndex, jsonb } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const membershipRoleEnum = pgEnum('membership_role', ['owner', 'admin', 'member']);

export const organizations = pgTable('organizations', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  plan: text('plan').default('free').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  defaultOrganizationId: uuid('default_organization_id').references(() => organizations.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const userCredentials = pgTable('user_credentials', {
  userId: uuid('user_id').references(() => users.id).notNull(),
  passwordHash: text('password_hash').notNull(),
  passwordVersion: text('password_version').default('argon2id:v1').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.userId] }),
}));

export const organizationMembers = pgTable('organization_members', {
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  role: membershipRoleEnum('role').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.organizationId, table.userId] }),
  byUser: index('organization_members_user_idx').on(table.userId),
}));

export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  activeOrganizationId: uuid('active_organization_id').references(() => organizations.id),
  refreshTokenHash: text('refresh_token_hash').notNull(),
  userAgent: text('user_agent'),
  ipAddress: text('ip_address'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  revokedAt: timestamp('revoked_at'),
  lastSeenAt: timestamp('last_seen_at'),
}, (table) => ({
  byUser: index('sessions_user_idx').on(table.userId),
  byRefresh: uniqueIndex('sessions_refresh_idx').on(table.refreshTokenHash),
  activeLookup: index('sessions_active_idx').on(table.userId, table.id).where(sql`revoked_at IS NULL`),
}));

export const userIdentities = pgTable('user_identities', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  provider: text('provider').notNull(),
  providerUserId: text('provider_user_id').notNull(),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  scopes: text('scopes'),
  expiresAt: timestamp('expires_at'),
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
}, (table) => ({
  uniq: uniqueIndex('user_identities_provider_idx').on(table.provider, table.providerUserId),
}));
```

**Schema Notes**
- Define the `membership_role` enum via a migration before table creation so Drizzle can reference it.
- `sessions.refresh_token_hash` stores a hashed opaque token; use an HMAC with server secret or Argon2 hash.
- Use triggers or application logic to update `updated_at`/`last_seen_at` timestamps.
- `sessions.activeOrganizationId` keeps per-session org context to avoid frequent lookups.
- Unique index on `sessions.refresh_token_hash` prevents token reuse; likewise, `user_identities_provider_idx` enforces uniqueness per provider.
- `user_identities.metadata` uses JSONB for flexible provider payloads.
- Partitioning is unnecessary initially, but keep indexes narrow to support primary Postgres as the session store.

## Email Service Stub
- Define a lightweight interface consumed by auth flows (verification, password reset placeholders, organization invites when ready).
- Provide an initial `LoggingEmailService` that writes payloads to structured logs and a `NoopEmailService` for tests.
- Use dependency injection so production can swap in SendGrid/Postmark/Mailgun adapters without touching the auth logic.

```ts
export type EmailPayload = {
  to: string;
  subject: string;
  template: 'verify-email' | 'reset-password' | 'org-invite';
  variables: Record<string, string>;
};

type LoggerLike = {
  info(metadata: Record<string, unknown>, message?: string): void;
};

export interface EmailService {
  sendEmail(payload: EmailPayload): Promise<void>;
}

export class LoggingEmailService implements EmailService {
  constructor(private logger: LoggerLike) {}

  async sendEmail(payload: EmailPayload): Promise<void> {
    this.logger.info({ channel: 'auth-email-stub', ...payload }, payload.subject);
  }
}

export class NoopEmailService implements EmailService {
  async sendEmail(): Promise<void> {
    // intentionally empty
  }
}
```

- Hook the stub into registration/password flows even before the templates exist; callers can guard behind feature flags until real emails are enabled.
- When a provider is selected, create an adapter implementing `EmailService` (e.g. `SendGridEmailService`) and register it via environment-driven factory.

## Organization Role Enforcement
- Owners: every organization must have at least one `owner`. Registration flow should create the user as owner for the initial organization.
- Role changes: only owners can promote/demote other members; owners cannot demote their own role if they are the last owner.
- Admins: manage members (add/remove), update organization profile, but cannot delete the org or change billing owner.
- Members: read/write data per product permissions but cannot manage users.
- Manual member addition (email-deferred): expose admin/owner-only endpoint that takes `userId` or email lookup; if user exists, attach membership with role `member` by default. Defer invite UX until email support (tracked in `todos/auth.md`).
- Session enforcement: when switching organizations, verify the requesting user has membership and update `sessions.active_organization_id`; if missing, return authorization error.
## Backend API Surface

### Password Auth
- `POST /auth/register` — Accepts email, password, name, organization payload; creates user + initial organization or attaches to existing one.
- `POST /auth/login` — Validates credentials, returns set-cookie header with session + access token.
- `POST /auth/logout` — Revokes current session (server deletes refresh token).
- `POST /auth/refresh` — Exchanges refresh cookie for new access token pair.
- `GET /auth/me` — Returns current user profile plus active organization context.
- `PATCH /auth/profile` — Allows updates to name/password (requires re-auth for password change).

### Social Auth
- `GET /auth/:provider/init` — Redirect to provider authorization URL (generates PKCE verifier + state, stores in Redis/session).
- `GET /auth/:provider/callback` — Exchanges code for tokens, creates or links user, issues session cookies.
- `POST /auth/:provider/link` — Adds provider to authenticated user.
- `POST /auth/:provider/unlink` — Removes provider identity (enforce at least one login method remaining).
- Current codebase exposes `/api/auth/:provider/init` and `/api/auth/:provider/callback` as 501 stubs backed by provider registry scaffolding; implementation follows once OAuth credentials are provisioned.

### Organizations
- `POST /organizations` — Create new organization and optionally invite/add members (invites deferred until email available).
- `GET /organizations` — List organizations current user belongs to.
- `POST /organizations/:id/switch` — Set active organization for current session.
- `POST /organizations/:id/members` — Add member via manual identifier (invite workflow deferred; see `todos/auth.md`).
- `DELETE /organizations/:id/members/:userId` — Remove member (respect role constraints).

### Internal Services & Utilities
- **TokenIssuer**: Creates JWT access tokens (short TTL, e.g. 15m) signed with `HS512` or `EdDSA`.
- **RefreshTokenManager**: Creates random opaque tokens (256-bit) stored hashed in DB.
- **PKCE Store**: Cache `code_verifier` + `state` between init and callback (Redis or encrypted cookie).
- **RateLimiter**: Wraps critical endpoints (e.g. 10/min per IP) using Redis when `REDIS_URL` is provided with an in-memory fallback.
- **EmailTemplates**: Markdown or MJML templates under `packages/backend/emails`.
- **EmailServiceFactory**: Produces either the logging stub or future provider-backed implementation based on env configuration.
- **Logger**: Lightweight structured logger wrapper (stdout JSON) for auth events until centralized logging is wired up.

## Frontend Considerations
- Centralize auth state in a MobX store (`packages/frontend/src/stores/authStore.ts`).
- Use React Query (or equivalent) for auth API calls to unify error handling.
- Encapsulate session handling in an `AuthProvider` component that:
  - Reads secure cookies via backend-only (the frontend receives access token via HTTP-only cookie; for API requests use `fetch` with credentials).
  - Refreshes tokens automatically before expiry.
- Provide shadcn-based UI components: `LoginForm`, `RegisterForm`, `ForgotPasswordForm`, `ProviderButtons`.
- Use dedicated routes (`/login`, `/register`, `/forgot-password`, `/callback/:provider`) and guard protected routes via a higher-order component or router middleware.

## Social Login Strategy
- Standardize on OAuth 2.0 Authorization Code Grant with PKCE for provider integrations.
- Define interface:
  ```ts
  type OAuthProvider = {
    name: 'google' | 'facebook' | 'apple';
    authUrl: (state: string, codeChallenge: string) => string;
    exchangeCode: (params: { code: string; codeVerifier: string }) => Promise<OAuthTokenResponse>;
    fetchProfile: (tokens: OAuthTokenResponse) => Promise<ProviderProfile>;
  };
  ```
- Implement provider-specific modules under `packages/backend/src/providers/`.
- Store provider client secrets in environment variables (`AUTH_GOOGLE_CLIENT_ID`, etc.); Apple requires JWT-signing with a key file → store in secure secret manager.
- Link external identities to existing users by matching verified email; if no account exists, create user with `email_verified_at` set when provider returns verified email claim.
- For Sign in with Apple, handle private relay email and support re-auth prompts.

## Security & Compliance
- **Password Storage**: Argon2id with parameters tuned for target hardware; rotate cost factors via `password_version`.
- **Email Verification**: Deferred until outbound email exists; plan to require verification with 24h expiry when introduced.
- **Session Security**: `Set-Cookie` with `HttpOnly`, `Secure`, `SameSite=Strict`. Access token can also be stored in secure cookie or returned in response body (frontend stores in memory).
- **CSRF**: Use double-submit cookie or SameSite cookies; for API, prefer Bearer tokens + `Authorization` header.
- **Brute Force Protection**: Rate limit + optional captcha after repeated failures.
- Current implementation prefers Redis for auth rate limiting when `REDIS_URL` is configured, falling back to in-memory storage for local development; production should enable Redis and add alerting on sustained throttling.
- **Logging**: Emit structured logs (user_id, request_id) for login attempts; push to centralized log aggregator.
- **Audit**: Log events like `user.login.success`, `user.login.failed`, `user.password.change`.
- **Secrets Management**: Use `.env` for local dev; load from encrypted secret store in staging/prod.
- **Compliance**: Document data retention; ensure ability to delete user data (GDPR).

## Session vs JWT Strategy

### Decision
- Adopt cookie-based server sessions as the primary authentication mechanism for the initial release. Access tokens (JWT) are not required; all auth checks rely on session cookies + server-side lookups.
- Maintain extension points so we can layer short-lived JWTs later if we introduce service-to-service auth or non-browser clients.

### Cookie-Based Server Sessions
- **Pros**: Simple to reason about; revocation is immediate by deleting the server-side session record; leverages HTTP-only cookies so tokens never touch JavaScript; aligns with CSRF mitigations via same-site cookies; easy to associate per-session organization context and device metadata.
- **Cons**: Requires shared persistence (database or cache) for session lookup which adds a read on every request; more state to manage across regions; mobile/third-party clients need additional work to handle cookies; scaling purely stateless services is harder.
- **Mitigations**: Use indexed lookups on the `sessions` table, colocate session store with API servers, and introduce sticky sessions or caching if latency becomes an issue. Primary Postgres will serve as the session store, so design for efficient queries (`user_id`, `session_id`, `revoked_at IS NULL` indexes).

### JWT-Only Access Tokens
- **Pros**: Stateless verification keeps hot paths fast; scales well across services/microservices; works naturally for non-browser clients; embeds claims such as organization id and roles directly.
- **Cons**: Token revocation is hard (must track deny lists or short TTLs); stolen tokens remain valid until expiry; larger attack surface if tokens are stored in browser storage; rotation and key management add operational overhead.

### Hybrid (Future Option)
- Keep the architectural guideposts from the hybrid approach (short-lived JWT access + refresh cookie) so we can adopt it later if product or platform needs change.

## Implementation Phases
1. **Foundation (Sprint 1)**
   - Create Drizzle models/migrations for users, credentials, organizations, organization_members, sessions, audit_logs.
   - Implement `/auth/register`, `/auth/login`, `/auth/logout`, `/auth/me`, `/auth/refresh`, `/auth/profile`.
   - Build organization endpoints for creation, listing, switching, membership management (non-email manual adds; invites deferred).
   - Add frontend forms, organization selector, and route guards.
   - Introduce `EmailService` interface with logging stub wired into auth flows (gated by feature flags where emails are not yet exposed).
2. **Session Hardening (Sprint 2)**
   - Instrument audit logging, rate limiting, and device/session management UI.
   - Implement session revocation flows (e.g. sign out of other sessions).
   - Add metrics dashboards for auth success/failure counts.
3. **Provider Abstractions (Sprint 3)**
   - Build OAuth toolkit + provider interface.
   - Implement Google sign-in end-to-end with organization linking rules.
   - Allow linking/unlinking providers in user settings.
4. **Additional Providers (Sprint 4)**
   - Add Facebook and Apple integrations.
   - Expand QA coverage (end-to-end tests, contract tests).
5. **Future Enhancements**
   - Email verification, password reset, and organization invitations once email infrastructure is ready.
   - Swap logging email stub for real provider adapter (SendGrid/Postmark/Mailgun) and add template rendering.
   - Rate limiting fallback (captcha), MFA / TOTP design, security reviews, and pen testing.

## Testing Strategy
- **Unit Tests**: Credential hashing, token issuance, provider modules with mocked HTTP.
- **Integration Tests**: Hono routes using supertest-like harness; ensure session cookies set and validated.
- **E2E Tests**: Playwright/Cypress covering login, logout, refresh, password reset.
- **Contract Tests**: Validate OAuth provider responses using recorded fixtures.
- **Load Tests**: Focus on `/auth/login` and `/auth/refresh` to verify rate limiting + DB indexes.

## Open Questions
- Do we require org-level billing/usage tracking during the initial release?
- What telemetry/alerting thresholds are expected for auth failures (deferred)?

## Next Steps Checklist
- [x] Design session schema + indexes for cookie-based approach (Drizzle models) backed by primary Postgres. *(See Drizzle Schema Sketch.)*
- [x] Finalize organization role model enforcement (owner/admin/member) and manual member addition UX. *(Implemented via `OrganizationSwitcher` UI + backend role checks.)*
- [ ] Define production alerting thresholds for Redis-backed rate limiter and hook into monitoring.
- [ ] Wire OAuth provider modules once credentials and redirect URIs are confirmed.
- [ ] Approve initial sprint scope and sequencing.
