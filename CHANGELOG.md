# Changelog — Spoorf Web Cloud Platform

All notable changes to the Spoorf Cloud ecosystem will be documented in this file.

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