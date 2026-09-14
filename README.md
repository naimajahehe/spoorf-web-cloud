# Spoorf Web Cloud Platform (`spoorf-web-cloud`)

Platform cloud resmi untuk otentikasi akun, manajemen lisensi (Free/Pro/VIP), kontrol batas sesi bersamaan (*Concurrent Session*), dan pemrosesan pembayaran (*Payment Gateway*) untuk ekosistem **NetCut Sentinel (Spoorf)**.

---

## 🏛️ Arsitektur Layanan (*Service Architecture*)

Proyek ini menggunakan arsitektur decoupled standar industri:

| Layanan | Teknologi | Port Default | Direktori | Keterangan |
| :--- | :--- | :---: | :--- | :--- |
| **Backend API** | Node.js 20 + Express + TypeScript | `4000` | `backend/` | REST API, Auth, RS256 Token Signer, Webhooks |
| **Frontend Portal**| React 18 + TypeScript + Vite + Tailwind | `3000` | `frontend/` | Landing page, Pricing, User Dashboard, Checkout |
| **Database** | PostgreSQL + Prisma ORM | `5432` | `backend/prisma/` | Users, Licenses, Sessions, Transactions |
| **Cache / Session**| Redis / Upstash Redis | `6379` | Cloud/Local | Concurrent session invalidation ("Kick"), Rate limiting |

---

## 📁 Struktur Direktori (*Best Practice Layout*)

```text
spoorf-web-cloud/
├── backend/                       # Express.js TypeScript REST API (:4000)
│   ├── keys/                      # Kriptografi Asimetris (license-private.pem & license-public.pem)
│   ├── prisma/                    # Skema Database PostgreSQL (schema.prisma)
│   ├── src/
│   │   ├── config/                # Konfigurasi env, database, dan payment gateway
│   │   ├── controllers/           # HTTP Request Handlers (auth, license, payment, user)
│   │   ├── middlewares/           # authGuard, rateLimiter, errorHandler, validate
│   │   ├── models/                # Model database & interfaces
│   │   ├── routes/                # Pemetaan endpoint rute Express
│   │   ├── services/              # Logika bisnis (auth, license, session, payment)
│   │   ├── types/                 # Definisi tipe data TypeScript
│   │   ├── utils/                 # Helper kriptografi RS256, logger, formatters
│   │   ├── app.ts                 # Konfigurasi middleware Express & routes
│   │   └── server.ts              # Entrypoint server HTTP
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/                      # React TypeScript + Vite Client (:3000)
│   ├── public/                    # Aset statis publik (logo, favicon, installer)
│   ├── src/
│   │   ├── assets/                # Gambar, banner, icons
│   │   ├── components/            # Komponen UI modular
│   │   │   ├── common/            # Button, Input, Modal, Card, Badge
│   │   │   └── layout/            # Navbar, Footer, Sidebar
│   │   ├── context/               # React Context (AuthContext)
│   │   ├── hooks/                 # Custom Hooks (useAuth, usePayment)
│   │   ├── pages/                 # View Pages (Home, Pricing, Login, Dashboard, Download)
│   │   ├── services/              # HTTP Client (Axios / Fetch) ke Backend API
│   │   ├── types/                 # Tipe data TypeScript klien
│   │   ├── utils/                 # Formatters, validator input
│   │   ├── App.tsx                # Client Routing (React Router)
│   │   └── main.tsx               # Root entry DOM
│   ├── .env.example
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   ├── vite.config.ts
│   └── tsconfig.json
│
└── .gitignore                     # Proteksi kunci privat, .env, dan build outputs
```

---

## 🔒 Prinsip Keamanan & Privasi
1. **Zero Network Telemetry:** Server cloud TIDAK PERNAH menerima atau menyimpan log IP target, domain DNS, atau lalu lintas data lokal pengguna desktop.
2. **Kriptografi Asimetris RS256:** Token lisensi ditandatangani menggunakan Private Key di server, dan divalidasi offline oleh Desktop App menggunakan Public Key.
3. **Concurrent Session Control:** Mencegah pembagian akun ilegal dengan membatasi sesi aktif simultan.
