# AGENTS.MD: Spoorf Web Cloud Platform Operational & Architecture Guide

> **Target Audience:** AI Coding Assistants (Google Antigravity, Claude, Copilot, Cursor) & Human Engineers.
> **Purpose:** Authoritative reference for backend standards, security invariants, architectural boundaries, and workflows.

---

## 1. System Overview & Services

| Service | Technology | Port | Working Directory | Launch / Test Command |
| :--- | :--- | :---: | :--- | :--- |
| **Backend API** | Node.js 20+ + Express + Prisma + RS256 JWT | `4000` | `d:/spoorf-web-cloud/backend` | `npm run dev` / `npm test` |
| **Frontend Portal** | React 18 + TypeScript + Vite + Tailwind | `3000` | `d:/spoorf-web-cloud/frontend` | `npm run dev` |
| **Database** | PostgreSQL 17 (Local / Cloud) | `5432` | Local / Managed Cloud | `spoorf_cloud` (dev) & `spoorf_cloud_test` (test) |

---

## 2. Core Architectural Invariants (Non-Negotiable Rules)

When modifying or refactoring code in this repository, you **MUST NEVER VIOLATE** the following invariants:

1. **Desktop Contract Backward Compatibility (SPEC-008)**:
   - Endpoint `POST /v1/auth/login` and `POST /api/v1/auth/login` MUST preserve the request/response JSON schema expected by `d:/spoorf/backend-node/src/services/licenseManager.ts`.
   - Payload keys `status: "success"`, `token`, `user: { id, name, email, avatar_url }`, and `license: { tier, max_cuts, can_throttle, can_gateway, can_autoreblock, can_arsenal, can_deep_fingerprint, cloud_sync, expires_at, grace_period_until }` must NEVER be renamed without migrating all clients.
2. **Asymmetric Cryptography Strictness (RS256 Only)**:
   - Private key `keys/license-private.pem` MUST NEVER be committed to Git (enforced via `.gitignore`).
   - Token verification MUST strictly enforce `algorithms: ['RS256']`. NEVER allow `HS256`, `none`, or key-confusion algorithms.
3. **Clean Layered Architecture (Separation of Concerns)**:
   - **Routes**: Routing and middleware mapping only. No database access.
   - **Controllers**: Parsing inputs, invoking services, returning standard response format.
   - **Services**: Pure business logic, database queries via Prisma, atomic transactions. No Express `req`/`res` coupling.
   - **Middlewares**: Input validation (Zod), Authentication, Authorization, Rate limiting, Centralized Error Handling.
   - **Errors**: Throw typed `AppError` subclasses (`BadRequestError`, `UnauthorizedError`, `ForbiddenError`, `NotFoundError`, `ConflictError`, `SessionRevokedError`, `TooManyRequestsError`). Never leak internal database stack traces to clients.
4. **Input Validation Before Execution**:
   - Every mutating endpoint (`POST`, `PUT`, `PATCH`, `DELETE`) MUST validate inputs using Zod schemas via `validateBody(schema)` before hitting controllers or services.
5. **Session Control (Zero-HWID "Kick Mechanism")**:
   - Enforce concurrent device limits per tier (Free: 1, Pro: 2, VIP: 5).
   - When limits are exceeded, mark older sessions `isRevoked: true` with an informative `revokedReason`.
   - Logging in with the same `sessionId` updates `lastSeenAt` and does NOT count as a duplicate concurrent session.
6. **Data Privacy & Telemetry Boundary**:
   - Cloud server NEVER accepts or stores target LAN IP addresses, spoofed MACs, or DNS queries from desktop clients.

---

## 3. Automated Test Verification & TDD Workflow

Always run the full test suite before asserting completion or committing:

```powershell
cd d:/spoorf-web-cloud/backend
npm test
```

All 29+ automated tests across Crypto, Database Integration, AuthService, and E2E API must pass (100% green).

---

## 4. Git Hygiene & Semantic Versioning

- Every phase/feature completion must update:
  1. `backend/package.json` (`version`)
  2. `frontend/package.json` (`version`)
  3. `CHANGELOG.md` (Detailed architectural notes)
- Commit messages MUST follow Conventional Commits:
  `feat(...)`, `fix(...)`, `chore(...)`, `docs(...)`, `test(...)`.