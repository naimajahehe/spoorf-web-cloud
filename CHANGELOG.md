# Changelog — Spoorf Web Cloud Platform

All notable changes to the Spoorf Cloud ecosystem will be documented in this file.

## [v0.0.5] - 2026-09-25

### Security Hardening: Web Session Entitlements, Voucher Stacking, Signing Key Safety & Honest Downloads
- **Background (audit 2026-09-25)**: every finding below was reproduced against `spoorf_cloud_test` before fixing, and each fix was prototyped in an isolated worktree before implementation.
  - A login with `platform: "web"` returned a token with the account's paid entitlements that used no device slot. Desktop builds trust only signed claims, so writing that token into the desktop cache gave an extra, uncounted licensed device that heartbeat kept renewing.
  - Parallel redemptions of different vouchers by one account consumed every voucher but kept only one voucher's days (30/30 stress trials).
  - `ensureKeyFilesExist` regenerated both keys when either file was missing, overwriting the private key. `backend/keys` holds the keypair embedded in desktop builds (same SPKI fingerprint).
  - Web logout never reached the server: the axios interceptor ran after the token was cleared (401). Logging in again from the same browser reactivated the revoked session and revived its old tokens, including after a remote "Putuskan".
  - `/download/latest` advertised `/downloads/Spoorf Sentinel Setup 1.0.0.exe`, which nothing serves (404), with stale metadata (v2.41.79).
- **Licensing (`authService.ts`)**:
  - Tokens for sessions stored with `platform: "web"` are signed with Free entitlements on login, register, heartbeat and redeem. The JSON `license` still shows the real tier for the dashboard, and desktop sessions are unchanged (SPEC-008 payload keys unchanged).
  - Voucher redemption takes the same per-user row lock as `bindSession`, so concurrent redemptions stack.
- **Crypto (`cryptoSigner.ts`)**:
  - A lone private or public key file is an error, never replaced. New `allowGenerate` option; `CryptoSigner` refuses to generate keys when `NODE_ENV=production`. Dev/test still bootstrap a keypair when none exists.
- **Downloads (`releaseService.ts`, `DownloadPage.tsx`)**:
  - Release metadata reflects desktop v2.41.82. `downloadUrl` comes only from the new optional `DESKTOP_DOWNLOAD_URL`; otherwise the response has `available: false` and the page shows a disabled "Belum tersedia" state. No installer is hosted yet.
- **Web Portal**:
  - Logout sends the token explicitly (with a `{}` body; a null body is sent as JSON `"null"` and rejected with 400).
  - Clearing the stored sign-in (logout or a rejected token) also resets the web session id, so the next login registers a fresh session.
- **Testing**:
  - New `unit_license_hardening.test.ts` (5), `unit_release_service.test.ts` (2) and 3 key-safety cases in `unit_crypto.test.ts`; the download E2E case now asserts `available: false`. Backend: 63/63 green.
  - New Playwright regression test `frontend/scripts/e2e-session-revocation.mjs` (`npm run test:e2e`, 9 checks): it passes on the fixed portal, and 5 checks fail on v0.0.4.
- **Review follow-ups (code review 2026-09-25)**: `issueSessionToken` fails closed to Free if a session row is unexpectedly absent; `DESKTOP_DOWNLOAD_URL` is restricted to `http(s)` (rejects `javascript:`/`data:`). Backend: 68/68 green.
- **Known limits (not addressed here)**: two desktops sharing one copied cache (same `session_id`) still count as one slot; revocation is still keyed by `session_id` server-side (a per-login token version is the planned follow-up); web sessions whose token expires without a revoke leave an orphaned active row until "revoke all" (a server-side reaper is the planned follow-up); there are no Prisma migrations yet.

## [v0.0.4] - 2026-09-23

### Security Hardening: Session Binding, Atomic Vouchers & Desktop License Contract
- **Background (audit 2026-09-23)**:
  - Tokens without a `sessionId` were never revocable, so logging in without `session_id` bypassed the concurrent device limit entirely.
  - Heartbeat and logout trusted `session_id` from the request body: any user could revoke another user's device or take over its session row.
  - Re-login with an old token resurrected kicked sessions, voucher redemption could be raced (10/10 concurrent redemptions of one voucher succeeded), and expired paid licenses kept issuing Pro/VIP tokens.
  - The E2E test suite silently ran against the development database.
- **Session Binding (`authGuard.ts`, `authService.ts`)**:
  - `session_id` is required on login; every token must reference a live session owned by the same user, otherwise `401 SESSION_REVOKED`.
  - Heartbeat and logout use the session from the verified token only (body mismatch → `403`); heartbeat no longer reassigns session ownership.
  - Token re-login is only accepted for the same user and same, still active session.
  - Device handover keeps working, and the previous owner's token is invalidated immediately.
  - Kick enforcement runs under a per-user row lock (`SELECT ... FOR UPDATE`) to stop parallel logins from exceeding the slot limit.
  - Web portal sessions (`platform: "web"`) are revocable but do not consume desktop device slots; `revoke-all` keeps the caller's own session.
- **Licensing (`authService.ts`)**:
  - Vouchers are claimed atomically (`updateMany where isUsed=false`), rate limited to 10 attempts / 15 min per account, extend same-tier licenses, and reject lower-tier vouchers.
  - Expired paid licenses are served as Free on login, heartbeat and `/auth/me`.
  - Heartbeat and `/auth/me` return the live `license`; `/auth/redeem` returns a rotated signed `token` carrying the new tier for desktop offline verification.
  - Unknown-email logins still run a bcrypt comparison to avoid account enumeration by timing.
- **Platform**:
  - Malformed JSON → `400 INVALID_JSON`, oversized payload → `413 PAYLOAD_TOO_LARGE`, disallowed CORS origin → `403`.
  - New `TRUST_PROXY` setting; session IP comes from `req.ip` instead of the raw `X-Forwarded-For` header.
  - Fixed `MIDTRANS_IS_PRODUCTION=false` being parsed as `true`.
- **Web Portal**:
  - Sends a persistent per-browser `session_id` with `platform: "web"`; the dashboard excludes web sessions from slot usage and marks the current browser.
  - Reads `VITE_API_URL` (matching `.env.example`); production builds fall back to same-origin `/v1` instead of `localhost`.
  - 401 responses only redirect to `/login` from protected routes; transient network errors no longer log the user out.
- **Testing**:
  - `tests/setup.ts` loads before every test file; Prisma refuses to run under `NODE_ENV=test` unless the database name ends with `_test`.
  - New `e2e_security_regression.test.ts` (13 cases); test vouchers are cleaned up after each suite.
  - Backend: 53/53 tests green. Cross-repo contract verified against the desktop `LicenseManager` (login → redeem → restart → expiry → remote revoke).
- **Breaking**: web users signed in before this release must log in once more (their tokens carry no `sessionId`). Installed desktop builds remain compatible.

## [v0.0.3] - 2026-09-16

### Enterprise Core Auth API & Desktop Bridge Layer
- **Architecture & Master Operational Standard**:
  - Established `AGENTS.md` in repository root as the non-negotiable architectural master rulebook.
  - Authored comprehensive `docs/API_SPEC.md` documenting REST contracts, error envelopes, and request/response models.
- **Fail-Fast Environment Validation (`src/config/env.ts`)**:
  - Implemented schema-driven environment bootstrapping via Zod (`PORT`, `DATABASE_URL`, `JWT_KEYS`, `CLIENT_URL`).
- **Structured JSON Logging & Observability (`src/utils/logger.ts`)**:
  - Lightweight zero-dependency JSON logger with correlation `requestId` tracing.
  - Recursive sensitive-field masking (`password`, `token`, `authorization`, `secret`).
- **Centralized Typed Error Handling & Validation**:
  - Created `src/errors/AppError.ts` hierarchy (`BadRequestError`, `UnauthorizedError`, `ForbiddenError`, `NotFoundError`, `ConflictError`, `SessionRevokedError`, `TooManyRequestsError`).
  - Added centralized Express error handler (`src/middlewares/errorHandler.ts`) mapping Zod validation, Prisma P2002/P2025, and custom app errors into uniform JSON envelopes.
  - Implemented Zod schema validation middleware (`validateBody`, `validateQuery`, `validateParams`).
- **Security & Rate Limiting**:
  - Implemented in-memory sliding-window rate limiters (`src/middlewares/rateLimiter.ts`) protecting authentication endpoints.
  - Hardened CORS exact-origin checks and Helmet security headers.
  - RS256 Bearer token authentication guard (`src/middlewares/authGuard.ts`) and RBAC role checks (`requireRole`).
- **Core Business Logic (`src/services/authService.ts`)**:
  - `register`: atomic user creation + default Free tier license assignment.
  - `login`: 100% desktop contract parity with `licenseManager.ts` (Zero-HWID `sessionId` extraction, password verification, RS256 signing).
  - `Concurrent Session Control (Kick Mechanism)`: enforces slot limits (Free: 1, Pro: 2, VIP: 5), revoking oldest sessions with educational feedback.
  - `sessionHeartbeat`: extends 7-day grace period and detects kicked sessions.
  - `redeemLicenseKey`: atomic voucher key validation and tier upgrade.
- **Automated Verification**:
  - Added `tests/unit_auth_service.test.ts` (7/7 tests passing).
  - Added `tests/e2e_auth_api.test.ts` (9/9 tests passing).
  - Total automated test count: **29 / 29 tests passing (100% green)**.

## [v0.0.2] - 2026-09-16

### PostgreSQL Database Infrastructure & Enriched Prisma Schema
- **Local PostgreSQL 17 Setup**:
  - Integrated local PostgreSQL service (`localhost:5432`) with separated databases: `spoorf_cloud` (development) and `spoorf_cloud_test` (automated test isolation).
- **Prisma Schema Architecture (`prisma/schema.prisma`)**:
  - **Full Desktop Contract Alignment**: Added `canDeepFingerprint` and `cloudSync` to `License` model, achieving 100% attribute parity with client `licenseManager.ts`.
  - **User-Friendly Session Revocation (Kick Mechanism)**: Added `deviceName`, `ipAddress`, `isRevoked`, `revokedAt`, and `revokedReason` to `Session` model for clear educational feedback when concurrent device limits are exceeded.
  - **License Voucher Keys**: Added `LicenseKey` model supporting promo, partner, and offline license key redemptions (`PRO-SENTINEL-...`).
  - **Transaction Auditing**: Added `snapToken`, `snapRedirectUrl`, and JSON `metadata` to `Transaction` model for Midtrans payment tracing and dispute resolution.
  - **Account Recovery**: Added `resetPasswordToken` and `resetPasswordExpires` to `User` model.
- **Database Singleton & Seeder**:
  - Created `src/config/database.ts` providing singleton `PrismaClient`, `pingDatabase()` health probe, and clean shutdown hooks.
  - Created automated seeder script `src/scripts/seed.ts` (`npm run seed`) creating initial Free, Pro, VIP demo accounts, and voucher keys.
- **Integration Test Suite**:
  - Added `tests/integration_database.test.ts` with 7 comprehensive integration tests covering health probe, 1-to-1 relations, unique constraints, session kick revocation, voucher redemptions, transaction lifecycles, and cascade deletions.
  - Total test pass count: **13 / 13 tests passed (100% green)**.

## [v0.0.1] - 2026-09-16

### Initial Asymmetric Cryptography & RS256 Token Foundation
- **RS256 Asymmetric Keypair Management**:
  - Implemented `generateRsaKeyPair` and `ensureKeyFilesExist` in `src/utils/cryptoSigner.ts`.
  - Added CLI generator `npm run keys:generate` (`src/scripts/generateKeys.ts`) producing standard PKCS#8 private key and SPKI public key.
  - Automated `.gitignore` protection ensuring private keys (`*.pem`, `*.key`) are never leaked to VCS.
- **Tamper-Proof License Token Signer & Verifier**:
  - Implemented `CryptoSigner` class with strict algorithm lockdown (`['RS256']`).
  - Mitigates algorithm substitution attacks (rejecting `HS256`, `none`, or key-confusion exploits).
  - Injects canonical issuer (`https://api.spoorf.app`), unique JWT ID (`jti`), and granular tier quotas (`maxCuts`, `canThrottle`, `canGateway`, `canAutoreblock`, `canArsenal`).
- **Automated TDD Test Suite**:
  - Added `tests/unit_crypto.test.ts` running with Node test runner + `tsx`.
  - 6/6 tests passing (100% green) covering generation, signing, decoding, payload tampering detection, algorithm lockdown, and expiration.