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
      "code": "VALIDATION_ERROR | UNAUTHORIZED | FORBIDDEN | NOT_FOUND | CONFLICT | SESSION_REVOKED | TOO_MANY_REQUESTS | INTERNAL_SERVER_ERROR",
      "message": "Deskripsi kesalahan yang mudah dipahami pengguna",
      "details": [],
      "timestamp": "2026-09-16T12:00:00.000Z",
      "requestId": "uuid-v4"
    }
  }
  ```

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
    "version": "0.0.3",
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
    "name": "Budi Pratama"
  }
  ```
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
    "grace_period_until": "2026-09-23T12:00:00.000Z"
  }
  ```
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

---

### 2.6 Logout
- **Endpoint:** `POST /v1/auth/logout`
- **Auth:** Bearer Token RS256
- **Request Body:**
  ```json
  {
    "session_id": "c7a8b9c0-d1e2-4f3a-8b5c-6d7e8f901234"
  }
  ```