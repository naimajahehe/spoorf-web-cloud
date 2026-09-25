# Spoorf Cloud API Specification (`/v1`)

Authoritative specification for client integration (Desktop NetCut Sentinel & Web Portal).

---

## 1. Base URL & Protocol
- Local Development: `http://localhost:4000/v1`
- Content-Type: `application/json`
- Standard Response Envelope on Error:
  ```json
  {
    "success": false,
    "error": {
      "code": "VALIDATION_ERROR | INVALID_JSON | PAYLOAD_TOO_LARGE | BAD_REQUEST | UNAUTHORIZED | FORBIDDEN | NOT_FOUND | CONFLICT | SESSION_REVOKED | TOO_MANY_REQUESTS | INTERNAL_SERVER_ERROR",
      "message": "Deskripsi kesalahan yang mudah dipahami pengguna",
      "details": [],
      "timestamp": "2026-09-16T12:00:00.000Z",
      "requestId": "uuid-v4"
    }
  }
  ```

### 1.1 Session Binding (sejak v0.0.4)
- Setiap token RS256 membawa klaim `sessionId` yang wajib menunjuk sesi aktif milik `userId` yang sama. Token tanpa sesi, sesi yang dicabut, atau sesi yang sudah berpindah ke akun lain ditolak dengan `401 SESSION_REVOKED`.
- `session_id` wajib pada login. Desktop mengirim UUID per instalasi; portal web mengirim UUID per browser dengan `platform: "web"`.
- Sesi `platform: "web"` dapat dicabut tetapi **tidak** memakai slot perangkat desktop (Free: 1, Pro: 2, VIP: 5).
- Sejak v0.0.5, token untuk sesi `web` ditandatangani dengan hak **Free** (login, register, heartbeat, redeem), sehingga tidak bisa dipakai sebagai perangkat desktop tambahan. Field JSON `license` pada respons tetap menunjukkan tier akun sebenarnya untuk tampilan dashboard. Platform diambil dari sesi yang tersimpan: login ulang tanpa `platform` tidak mengubahnya.
- Lisensi berbayar yang melewati `expires_at` dilayani sebagai Free pada login, heartbeat, dan `/auth/me`.
- Klaim token (`tier`, `maxCuts`, `canThrottle`, `canGateway`, `canAutoreblock`, `canArsenal`, `canDeepFingerprint`, `cloudSync`, `expiresAt`, `gracePeriodUntil`, `sessionId`, `iat`, `exp`, `iss`) adalah sumber lisensi offline desktop setelah diverifikasi dengan public key.

---

## 2. Endpoints

### 2.1 Health Check
- **Endpoint:** `GET /v1/health`
- **Auth:** Public
- **Response (200 OK):**
  ```json
  {
    "status": "healthy",
    "service": "spoorf-web-cloud",
    "version": "0.0.4",
    "uptimeSeconds": 120,
    "timestamp": "2026-09-16T12:00:00.000Z",
    "database": "connected"
  }
  ```

---

### 2.2 Register User
- **Endpoint:** `POST /v1/auth/register`
- **Auth:** Public (Rate limited: 30 req / 15 min)
- **Request Body:**
  ```json
  {
    "email": "user@gmail.com",
    "password": "SecurePassword123!",
    "name": "Budi Pratama",
    "session_id": "0f1e2d3c-4b5a-4968-8776-655443322110",
    "platform": "web"
  }
  ```
- **Aturan:** `session_id` dan `platform` opsional. Bila `session_id` tidak dikirim, server membuat sesi web baru. Password 8–72 karakter.
- **Response (201 Created):**
  ```json
  {
    "status": "success",
    "token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "usr_uuid",
      "name": "Budi Pratama",
      "email": "user@gmail.com",
      "avatar_url": null
    },
    "license": {
      "tier": "free",
      "max_cuts": 5,
      "can_throttle": false,
      "can_gateway": false,
      "can_autoreblock": false,
      "can_arsenal": false,
      "can_deep_fingerprint": false,
      "cloud_sync": false,
      "expires_at": null,
      "grace_period_until": "2026-09-23T12:00:00.000Z"
    }
  }
  ```

---

### 2.3 Login (Desktop & Web)
- **Endpoint:** `POST /v1/auth/login` (or `/api/v1/auth/login`)
- **Auth:** Public (Rate limited: 30 req / 15 min)
- **Request Body (Desktop Client Contract):**
  ```json
  {
    "email": "user@gmail.com",
    "password": "SecurePassword123!",
    "session_id": "c7a8b9c0-d1e2-4f3a-8b5c-6d7e8f901234",
    "hwid": "c7a8b9c0-d1e2-4f3a-8b5c-6d7e8f901234",
    "platform": "win32",
    "app_version": "2.41.36",
    "deviceName": "Laptop Asus ROG"
  }
  ```
- **Aturan:**
  - `session_id` (atau `sessionId` / `hwid`, 8–128 karakter) **wajib**; tanpa itu → `400 BAD_REQUEST`.
  - Salah satu dari `password` atau `token` wajib. Login dengan `token` hanya diterima bila token milik akun yang sama, `sessionId` di token sama dengan `session_id`, dan sesi tersebut masih aktif (sesi yang sudah dicabut → `401 SESSION_REVOKED`).
  - Portal web mengirim `"platform": "web"`; sesi web tidak memicu kick perangkat desktop.
  - Login dengan `session_id` yang dimiliki akun lain memindahkan sesi ke akun ini; token milik akun sebelumnya langsung ditolak.
- **Response (200 OK):**
  ```json
  {
    "status": "success",
    "token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "usr_uuid",
      "name": "Budi Pratama",
      "email": "user@gmail.com",
      "avatar_url": null
    },
    "license": {
      "tier": "pro",
      "max_cuts": 999,
      "can_throttle": true,
      "can_gateway": true,
      "can_autoreblock": true,
      "can_arsenal": false,
      "can_deep_fingerprint": true,
      "cloud_sync": true,
      "expires_at": "2027-09-16T00:00:00.000Z",
      "grace_period_until": "2026-09-23T12:00:00.000Z"
    }
  }
  ```

---

### 2.4 Session Heartbeat (Masa Tenggang & Anti-Kick Check)
- **Endpoint:** `POST /v1/auth/heartbeat`
- **Auth:** Bearer Token RS256
- **Request Body:**
  ```json
  {
    "session_id": "c7a8b9c0-d1e2-4f3a-8b5c-6d7e8f901234"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "status": "success",
    "token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
    "isRevoked": false,
    "grace_period_until": "2026-09-23T12:00:00.000Z",
    "license": {
      "tier": "pro",
      "max_cuts": 999,
      "can_throttle": true,
      "can_gateway": true,
      "can_autoreblock": true,
      "can_arsenal": false,
      "can_deep_fingerprint": true,
      "cloud_sync": true,
      "expires_at": "2027-09-16T00:00:00.000Z",
      "grace_period_until": "2026-09-23T12:00:00.000Z"
    }
  }
  ```
- **Aturan:** sesi diambil dari klaim token. `session_id` di body bersifat opsional; bila berbeda dari sesi pada token → `403 FORBIDDEN`. Token yang dirotasi membawa lisensi terkini (termasuk penurunan ke Free saat kedaluwarsa) sebagai klaim bertanda tangan.
- **Response jika Sesi Telah Dicabut (401 Unauthorized):**
  ```json
  {
    "success": false,
    "error": {
      "code": "SESSION_REVOKED",
      "message": "Sesi Anda telah dicabut karena batas login bersamaan terlampaui (login baru dari perangkat lain).",
      "details": { "isRevoked": true }
    }
  }
  ```

---

### 2.5 Redeem License Voucher Key
- **Endpoint:** `POST /v1/auth/redeem`
- **Auth:** Bearer Token RS256
- **Request Body:**
  ```json
  {
    "key": "PRO-SENTINEL-DEV-2026"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "status": "success",
    "message": "Kode voucher lisensi berhasil diaktivasi.",
    "token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
    "license": {
      "tier": "pro",
      "max_cuts": 999,
      "can_throttle": true,
      "can_gateway": true,
      "can_autoreblock": true,
      "can_arsenal": false,
      "can_deep_fingerprint": true,
      "cloud_sync": true,
      "expires_at": "2026-10-16T12:00:00.000Z",
      "grace_period_until": "2026-09-23T12:00:00.000Z"
    }
  }
  ```
- **Aturan:**
  - Rate limit: 10 percobaan / 15 menit per akun.
  - Voucher diklaim secara atomik; penggunaan ulang (termasuk request bersamaan) → `400`.
  - Voucher tier yang sama dengan lisensi aktif **memperpanjang** masa berlaku; voucher tier lebih rendah dari lisensi aktif ditolak (`400`).
  - `token` adalah token sesi baru berisi tier hasil redeem; klien desktop menggantikan token lamanya dengan token ini.

---

### 2.6 Logout
- **Endpoint:** `POST /v1/auth/logout`
- **Auth:** Bearer Token RS256
- **Request Body:** kosong (`{}`). Sesi yang dicabut adalah sesi pada klaim token; `session_id` di body diabaikan.

---

### 2.7 Current Profile
- **Endpoint:** `GET /v1/auth/me`
- **Auth:** Bearer Token RS256
- **Response (200 OK):** `user` dan `license` diambil dari database (bukan dari klaim token yang bisa basi).
  ```json
  {
    "status": "success",
    "user": {
      "id": "usr_uuid",
      "userId": "usr_uuid",
      "email": "user@gmail.com",
      "name": "Budi Pratama",
      "role": "user",
      "tier": "pro",
      "avatar_url": null
    },
    "license": { "tier": "pro", "max_cuts": 999, "can_throttle": true, "expires_at": "2027-09-16T00:00:00.000Z", "grace_period_until": "2026-09-23T12:00:00.000Z" }
  }
  ```

---

### 2.8 Session Management (Web Dashboard)
- **Auth:** Bearer Token RS256 (semua endpoint)
- `GET /v1/sessions` → `{ "success": true, "sessions": [ { "id", "sessionId", "deviceName", "platform", "appVersion", "ipAddress", "isRevoked", "revokedAt", "revokedReason", "lastSeenAt", "createdAt", "is_online" } ] }`
- `POST /v1/sessions/:id/revoke` → cabut satu sesi milik pemanggil (berdasarkan `id` atau `sessionId`); sesi milik akun lain → `404 NOT_FOUND`.
- `POST /v1/sessions/revoke-all` → cabut semua sesi aktif pemanggil **kecuali** sesi yang sedang dipakai untuk request ini. Response: `{ "success": true, "revokedCount": 2, "message": "..." }`.
- Desktop mendeteksi pencabutan pada heartbeat berikutnya (`401 SESSION_REVOKED`).
- Sejak v0.0.6, setiap login menandai sesi `web` milik akun yang sama yang tidak aktif lebih lama dari masa berlaku token (30 hari) sebagai dicabut dengan `revokedReason` "Sesi web kedaluwarsa: token berakhir tanpa logout.". Sesi desktop tidak terpengaruh.

---

### 2.9 Latest Desktop Release
- **Endpoint:** `GET /v1/download/latest` (publik)
- `downloadUrl` berisi `DESKTOP_DOWNLOAD_URL` bila dikonfigurasi, selain itu `null` dan `available: false`. Klien tidak boleh menyusun URL unduhan sendiri.
```json
{
  "success": true,
  "available": false,
  "release": {
    "version": "2.41.82",
    "platform": "windows-x64",
    "filename": "Spoorf Sentinel Setup 2.41.82.exe",
    "fileSizeBytes": 103946681,
    "releaseDate": "2026-09-23",
    "releaseNotes": "...",
    "downloadUrl": null
  }
}
```
