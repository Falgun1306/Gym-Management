# ⚡ Vajra Fitness — Gym Management System

[![Node.js](https://img.shields.io/badge/Node.js-v18+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-v5.2.1-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![React](https://img.shields.io/badge/React-v19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-v8-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Prisma ORM](https://img.shields.io/badge/Prisma-v7.8.0-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Razorpay](https://img.shields.io/badge/Razorpay-Integrated-02042B?logo=razorpay&logoColor=white)](https://razorpay.com/)
[![PWA Ready](https://img.shields.io/badge/PWA-Enabled-FF6B6B?logo=pwa&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)

> An enterprise-grade, full-stack gym and fitness club management platform featuring dedicated role-based portals for **Administrators**, **Personal Trainers**, and **Members**. Built with high-security JWT authentication, dynamic QR code attendance, Razorpay payments, custom workout & nutrition builders, automated cron jobs, and Progressive Web App (PWA) support.

---

## 📌 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
  - [🛡️ Admin Portal](#️-admin-portal)
  - [🏋️ Trainer Portal](#️-trainer-portal)
  - [🏃 Member Portal](#-member-portal)
  - [⏰ Automated Background Engine (Cron Jobs)](#-automated-background-engine-cron-jobs)
  - [📱 Progressive Web App (PWA)](#-progressive-web-app-pwa)
- [System Architecture](#-system-architecture)
- [Tech Stack](#-tech-stack)
- [Project Directory Structure](#-project-directory-structure)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [1. Clone Repository](#1-clone-repository)
  - [2. Backend Configuration & Setup](#2-backend-configuration--setup)
  - [3. Database Migration & Seeding](#3-database-migration--seeding)
  - [4. Frontend Configuration & Setup](#4-frontend-configuration--setup)
- [Environment Variables Guide](#-environment-variables-guide)
  - [Server (`server/.env`)](#server-serverenv)
  - [Client (`client/.env`)](#client-clientenv)
- [Default Credentials](#-default-credentials)
- [API Endpoints Overview](#-api-endpoints-overview)
- [Testing](#-testing)
- [Screenshots & UI Showcase](#-screenshots--ui-showcase)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🌟 Overview

**Vajra Fitness** is designed to streamline day-to-day fitness club operations, bridge the communication gap between trainers and clients, and provide members with a modern, self-service fitness companion.

Whether it is scheduling group classes, tracking biometric milestones, scanning dynamic QR tokens at the front desk, processing online membership fees via Razorpay, or scheduling maintenance for gym equipment, Vajra Fitness covers the entire gym ecosystem under a unified, ultra-responsive web application.

---

## 🚀 Key Features

### 🛡️ Admin Portal
- **Executive Analytics Dashboard**: Real-time revenue insights, active vs. expiring memberships, trainer-to-member ratios, and attendance trends.
- **Member Management**: Comprehensive directory with biometric profiles, membership history, assigned trainers, medical notes, and status management.
- **Trainer Management & Onboarding**:
  - Review and approve/reject trainer applications with cover notes and certifications.
  - Direct promotion of existing users to certified trainers.
  - Specialization tagging (CrossFit, Strength, Yoga, Bodybuilding, etc.).
- **Membership Plans Engine**: Configurable subscription tiers, custom pricing, duration (in months), and trainer level designation (`COMMON` vs. `PERSONAL`).
- **Discount & Referral System**:
  - Promo code management supporting `PERCENTAGE` discounts, `FIXED_AMOUNT` deductions, or `FREE_DAYS` extensions.
  - Granular limits (max usage cap, minimum order value, per-user limits, and plan-specific applicability).
  - Automated referral rewards for both referee and referrer.
- **Financials & Invoicing**:
  - Track online Razorpay transactions and manual cash/POS payments.
  - Instant PDF invoice generation and download powered by `PDFKit`.
  - Process and log full/partial refunds with audit trails.
- **Gym Classes & Equipment Operations**:
  - Schedule recurring gym sessions with trainer assignments and capacity caps.
  - Equipment inventory tracking with maintenance cycles (`AVAILABLE`, `IN_USE`, `UNDER_MAINTENANCE`, `DAMAGED`, `RETIRED`).
- **Grievance / Complaint Desk**: Review and resolve member feedback and maintenance complaints.

### 🏋️ Trainer Portal
- **Trainer Command Center**: Overview of active clients, weekly schedule, rating averages, and upcoming scheduled classes.
- **Client Management**: Quick access to assigned members' profiles, attendance streaks, and injury notes.
- **Workout Plan Architect**:
  - Create customized workout plans selecting from an extensive exercise catalog categorized by muscle group and difficulty.
  - Specify target sets, reps, weight targets, and rest intervals.
- **Diet & Nutrition Builder**: Construct macronutrient-balanced diet charts specifying calorie caps, protein, carb, and fat targets.
- **Attendance & Space Management**:
  - View member attendance logs and manually mark/verify presence.
  - Monitor member time-slot selections and issue crowd advisories to prevent floor overcrowding.
- **Class Schedules & Leave Management**:
  - View attendee rosters for booked fitness classes.
  - Configure weekly shift availability and submit time-off requests.
- **Performance & Reviews**: View weekly member ratings and client feedback.

### 🏃 Member Portal
- **Personal Fitness Dashboard**: Membership countdown timer, assigned workouts, daily nutrition targets, and upcoming class alerts.
- **Contactless QR Code Check-In**:
  - Generates an encrypted, time-limited (5-minute rolling token) QR code for fast, touchless front-desk check-in.
- **Membership Purchases & Renewals**:
  - Browse available gym plans.
  - Apply active discount/referral coupons during checkout.
  - Secure payments via Razorpay (UPI, Credit/Debit Cards, NetBanking).
  - Download official PDF receipts.
- **Membership Freeze / Pause**: Self-service feature to pause memberships for travel or medical reasons within policy limits.
- **Daily Workout & Nutrition Tracking**:
  - View today’s assigned exercises, complete with form demo links, sets, and reps.
  - Access dietary recommendations provided by the assigned personal trainer.
- **Biometric Progress Logging**: Record body measurements (weight, chest, waist, arms, thighs) and track fitness transformations over time.
- **Group Class Booking**: Browse the daily schedule and book or cancel class spots with real-time seat availability.
- **Crowd Density & Time Slot Booking**: Reserve preferred gym time slots to maintain crowd control and avoid peak rush hours.
- **Trainer Ratings & Support Desk**:
  - Submit weekly star ratings (1-5) and feedback for assigned personal trainers.
  - Raise complaints or facility issues directly to gym administrators.

### ⏰ Automated Background Engine (Cron Jobs)
Integrated background workers run automatically on the server (configured in `server/src/config/jobScheduler.js` via `node-cron` in `Asia/Kolkata` time):

| Job Name | Schedule | Description |
|---|---|---|
| **MembershipExpiry** | `0 0 * * *` (Midnight) | Detects expired memberships, flags status as `EXPIRED`, and notifies members. |
| **PaymentReminder** | `0 9 * * *` (9:00 AM) | Sends email alerts to members with memberships expiring within 3 days. |
| **ClassReminder** | `0 20 * * *` (8:00 PM) | Sends evening email reminders for upcoming classes scheduled for the next day. |
| **NotificationCleanup** | `0 3 * * 0` (Sunday 3 AM) | Automatically purges read notifications older than 30 days. |
| **AttendanceCleanup** | `59 23 * * *` (11:59 PM) | Automatically marks end-of-day check-outs for open attendance sessions. |
| **EquipmentMaintenance** | `0 7 * * *` (7:00 AM) | Alerts admins regarding equipment overdue for scheduled maintenance. |
| **NoShowMarker** | `0 23 * * *` (11:00 PM) | Automatically marks un-checked-in class reservations as `NO_SHOW`. |

### 📱 Progressive Web App (PWA)
- **Installable**: Full Web App Manifest (`manifest.json`) and service worker (`sw.js`) supporting desktop and mobile installation (Chrome, Safari, Edge).
- **Native Experience**: Standalone window display, theme color matching (`#059669`), and fast asset caching.
- **Smart App Routing**: When launched in PWA standalone or mobile wrap mode, visitors bypass marketing pages and are taken directly to their authenticated dashboard or login screen.

---

## 🏗️ System Architecture

```mermaid
flowchart TD
    subgraph Client["Frontend Client (React 19 + Vite + Tailwind CSS)"]
        UI[Responsive Web & PWA]
        Store[Zustand State Store]
        Query[TanStack React Query]
        QR_Scanner[QR Code Generator / Scanner]
    end

    subgraph Server["Backend API (Node.js + Express 5)"]
        Router[Express Routers /api/v1/*]
        Auth[JWT & Argon2 Security]
        Services[Business Logic Services]
        Cron[Node-Cron Scheduler]
        PDF[PDFKit Invoicing]
    end

    subgraph Database["Database & Integrations"]
        PG[(PostgreSQL Database)]
        Prisma[Prisma ORM v7]
        Razorpay[Razorpay Payment Gateway]
        SMTP[Nodemailer / Gmail OAuth2]
    end

    UI -->|HTTP / Cookies| Router
    Router --> Auth
    Auth --> Services
    Services --> Prisma
    Prisma --> PG
    Services --> Razorpay
    Services --> SMTP
    Services --> PDF
    Cron --> Services
```

---

## 💻 Tech Stack

### Frontend
- **Framework & Runtime**: React 19, Vite 8
- **Styling**: Tailwind CSS v4, Lucide React Icons
- **State & Server Cache**: Zustand, TanStack React Query v5
- **Routing**: React Router DOM v7
- **Media & QR**: `html5-qrcode`, `jsqr`, `qrcode`
- **Notifications & Alerts**: React Hot Toast

### Backend
- **Framework & Server**: Node.js, Express v5 (ES Modules)
- **Database ORM**: Prisma 7 with PostgreSQL adapter (`@prisma/adapter-pg`)
- **Security & Cryptography**: Argon2, JSON Web Tokens (`jsonwebtoken`), HTTP-only Cookies
- **Payment Processing**: Official Razorpay SDK (`razorpay`), Webhook Signature Verification
- **Job Scheduling**: `node-cron`
- **PDF Generation**: `pdfkit`
- **Email Delivery**: `nodemailer` with Gmail OAuth2 / SMTP support
- **Testing**: Jest 30, Supertest 7

---

## 📂 Project Directory Structure

```text
Gym-Management/
├── client/                      # Frontend Single Page Application & PWA
│   ├── public/                  # PWA manifest, service worker, icons, svgs
│   │   ├── manifest.json
│   │   ├── sw.js
│   │   └── images/
│   ├── src/
│   │   ├── components/          # Reusable UI components, guards, layouts
│   │   │   ├── auth/            # ProtectedRoute, RoleGuard
│   │   │   ├── layouts/         # DashboardLayout, Sidebar, Navbar
│   │   │   ├── members/         # Member modals, QR codes
│   │   │   └── ui/              # Buttons, Cards, Modals, Badges, Tables
│   │   ├── hooks/               # Custom React hooks (e.g. useAppMode)
│   │   ├── pages/
│   │   │   ├── admin/           # Admin dashboards, trainers, plans, coupons, equipment
│   │   │   ├── auth/            # Login, Register, Forgot/Reset Password
│   │   │   ├── dashboard/       # Core dashboard home
│   │   │   ├── members/         # Member dashboard, workouts, diets, attendance, slots
│   │   │   ├── trainers/        # Trainer dashboards, schedules, routines, time slots
│   │   │   └── LandingPage.jsx  # Public marketing page
│   │   ├── store/               # Zustand auth and preferences stores
│   │   ├── services/            # Axios API wrappers
│   │   ├── App.jsx              # Routing and portal guards
│   │   └── main.jsx             # React entry point
│   ├── package.json
│   └── vite.config.js
│
├── server/                      # Backend REST API Server
│   ├── prisma/
│   │   ├── schema.prisma        # Complete database schema
│   │   └── seed.js              # Initial database seeder
│   ├── src/
│   │   ├── config/              # DB connection, cron job scheduler
│   │   ├── controller/          # Route controller handlers
│   │   ├── jobs/                # Background cron tasks
│   │   ├── middlewares/         # Auth, Role Authorization, Validation, Error Handling
│   │   ├── repositories/        # Database access layer
│   │   ├── routes/              # Express API route modules
│   │   ├── services/            # Core business logic (Payments, QR, Members, Plans)
│   │   ├── templates/emails/    # HTML email notification templates
│   │   ├── utility/             # Helper utilities (PDF generation, tokens)
│   │   ├── validations/         # Request validation schemas
│   │   ├── app.js               # Express application configuration & CORS
│   │   └── server.js            # Server entry point
│   ├── tests/                   # Jest & Supertest API test suites
│   ├── package.json
│   └── .env.example
│
├── UI design examples/          # 30+ High-resolution UI screenshots & design specs
├── mobileUI/                    # Mobile layout screenshots
├── vercel.json                  # Frontend deployment routing configuration
└── README.md
```

---

## 🛠️ Getting Started

### Prerequisites
Make sure you have the following installed on your machine:
- **Node.js**: `v18.0.0` or higher (recommended: `v20.x`)
- **PostgreSQL**: `v14.0` or higher
- **Git**: For version control
- **npm** or **pnpm** / **yarn**

---

### 1. Clone Repository

```bash
git clone https://github.com/Falgun1306/Gym-Management.git
cd Gym-Management
```

---

### 2. Backend Configuration & Setup

1. Navigate to the server folder and install dependencies:
   ```bash
   cd server
   npm install
   ```

2. Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```

3. Update the `.env` variables (e.g., PostgreSQL credentials, JWT secret, Razorpay test keys):
   ```env
   NODE_ENV="development"
   PORT=5000
   CLIENT_URL="http://localhost:3000"
   JWT_SECRET="your_strong_jwt_secret_key"
   JWT_EXPIRES_IN="2d"
   DATABASE_URL="postgresql://postgres:password@localhost:5432/gym_management?schema=public"

   # Razorpay Test Credentials
   RAZORPAY_KEY_ID="rzp_test_xxxxxxxxxxxx"
   RAZORPAY_KEY_SECRET="your_razorpay_secret"
   RAZORPAY_WEBHOOK_SECRET="your_webhook_secret"

   # QR Code Configuration
   QR_TOKEN_SECRET="your_secure_qr_secret_token"
   QR_TOKEN_EXPIRY_MINUTES=5
   ```

---

### 3. Database Migration & Seeding

1. Push the Prisma schema to create all tables and relationships in PostgreSQL:
   ```bash
   npx prisma db push
   ```

2. Seed the initial Administrator account:
   ```bash
   npm run seed
   ```

3. Start the backend development server:
   ```bash
   npm run dev
   ```
   > 🚀 Server will run at `http://localhost:5000` with automated cron jobs initialized.

---

### 4. Frontend Configuration & Setup

1. Open a new terminal tab, navigate to the `client` directory, and install dependencies:
   ```bash
   cd ../client
   npm install
   ```

2. Create a `.env` file:
   ```bash
   cp .env.example .env
   ```
   > In local development, `VITE_API_URL="/api/v1"` uses the built-in Vite reverse proxy to forward requests to `http://127.0.0.1:5000`.

3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   > 🌐 Open your browser at `http://localhost:3000`.

---

## ⚙️ Environment Variables Guide

### Server (`server/.env`)

| Variable | Required | Default / Example | Description |
|---|:---:|---|---|
| `PORT` | No | `5000` | Port for the Express server to listen on |
| `NODE_ENV` | No | `development` | Environment mode (`development` / `production`) |
| `CLIENT_URL` | Yes | `http://localhost:3000` | Allowed client origins for CORS (comma-separated if multiple) |
| `DATABASE_URL` | Yes | `postgresql://user:pwd@localhost:5432/db` | PostgreSQL connection string for Prisma |
| `JWT_SECRET` | Yes | `supersecret` | Secret key used to sign JWT auth cookies |
| `JWT_EXPIRES_IN` | No | `2d` | Expiration lifespan for JWT sessions |
| `EMAIL_HOST` | No | `smtp.gmail.com` | SMTP host for sending emails |
| `EMAIL_PORT` | No | `587` | SMTP port |
| `GMAIL_USER` | No | `your_email@gmail.com` | Notification sender email address |
| `CLIENT_ID` | No | `google_client_id` | Google OAuth2 Client ID for Gmail API |
| `CLIENT_SECRET` | No | `google_client_secret` | Google OAuth2 Client Secret |
| `GMAIL_REFRESH_TOKEN` | No | `google_refresh_token` | Refresh token for OAuth2 email delivery |
| `EMAIL_FROM` | No | `Vajra Fitness <no-reply@gym.com>` | Formatted email sender signature |
| `RAZORPAY_KEY_ID` | Yes | `rzp_test_...` | Razorpay API key ID |
| `RAZORPAY_KEY_SECRET` | Yes | `your_secret` | Razorpay API secret key |
| `RAZORPAY_WEBHOOK_SECRET` | No | `webhook_secret` | Secret to verify incoming payment webhooks |
| `QR_TOKEN_SECRET` | Yes | `qr_secret_key` | Secret key to sign dynamic QR check-in tokens |
| `QR_TOKEN_EXPIRY_MINUTES`| No | `5` | Lifespan of QR tokens before auto-expiry |

### Client (`client/.env`)

| Variable | Required | Default | Description |
|---|:---:|---|---|
| `VITE_API_URL` | Yes | `/api/v1` | Base API URL (uses Vite proxy locally, or absolute URL in production) |

---

## 🔑 Default Credentials

Running `npm run seed` inside `server/` creates the initial Super Admin account:

- **Email**: `admin@gym.com`
- **Password**: `admin123`
- **Role**: `ADMIN`

> ⚠️ **Security Notice**: Change the default admin password immediately in production settings!

---

## 📡 API Endpoints Overview

All REST API endpoints are prefixed with `/api/v1/`:

| Route Prefix | Primary Controller | Access Level | Description |
|---|---|---|---|
| `/users` | `auth.controller.js` | Public / Auth | User registration, login, logout, password recovery |
| `/admins` | `admin.controller.js` | `ADMIN` | Admin dashboard, trainer approvals, member management, plans |
| `/members` | `member.controller.js` | `MEMBER` | Member profile, subscriptions, class bookings, progress logs |
| `/trainers` | `trainer.controller.js` | `TRAINER` | Trainer dashboard, client list, schedules, workouts, diets |
| `/payments` | `payment.controller.js` | `MEMBER` / `ADMIN` | Razorpay order creation, payment verification, invoice PDF, refunds |
| `/attendance` | `attendance.controller.js`| All Roles | Check-in/out, dynamic QR generation, scanner verification |
| `/gym-classes` | `gymClass.controller.js`| All Roles | Group class scheduling, browsing, and capacity bookings |
| `/workouts` | `workout.controller.js` | `TRAINER` / `MEMBER` | Exercise repository, custom workout plan assignments |
| `/diets` | `diet.controller.js` | `TRAINER` / `MEMBER` | Meal schedules and nutritional assignments |
| `/time-slots` | `timeSlot.controller.js` | All Roles | Crowd density management and preferred workout slot bookings |
| `/coupons` | `coupon.controller.js` | All Roles | Discount coupon creation, validation, and referral links |
| `/equipment` | `equipment.controller.js`| `ADMIN` | Gym gear inventory tracking and maintenance logs |
| `/complaints` | `complaint.controller.js`| All Roles | Member ticket submission and administrative resolutions |
| `/notifications`| `notification.controller.js`| Authenticated | In-app alerts, unread counts, and status updates |
| `/reports` | `report.controller.js` | `ADMIN` | Financial summaries and attendance analytics |
| `/health` | `health.controller.js` | Public | System and PostgreSQL database health checks |

---

## 🧪 Testing

The backend includes a comprehensive suite of automated tests using **Jest** and **Supertest** covering authentication, role-based authorization, payment flows, coupon validations, and QR check-in services.

Run the test suites from the `server/` folder:

```bash
cd server

# Run all test suites
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with code coverage report
npm run test:coverage
```

---

## 🎨 Screenshots & UI Showcase

The repository contains 30+ visual mockups and screenshots illustrating all aspects of the application in [`UI design examples/`](./UI%20design%20examples/) and [`mobileUI/`](./mobileUI/):

- **Admin Dashboard**: System health, active revenue, user growth charts
- **Trainer Dashboard & Schedules**: Member management, routine creation
- **Member Portal & Attendance**: Dynamic QR check-in, diet & workout viewers
- **Membership & Payments**: Checkout, coupon validation, invoice downloads
- **Mobile Responsive & PWA**: Optimized navigation for smartphones and tablets

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **ISC License**.
