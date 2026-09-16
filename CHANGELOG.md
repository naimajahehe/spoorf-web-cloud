# Changelog — Spoorf Web Cloud Platform

All notable changes to the Spoorf Cloud ecosystem will be documented in this file.

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