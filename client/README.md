# 🏋️ Vajra Fitness — Client Application

This is the frontend single-page application and Progressive Web App (PWA) for **Vajra Fitness Gym Management System**.

Built with **React 19**, **Vite 8**, and **Tailwind CSS v4**.

For complete system documentation, architecture, API endpoints, and full-stack setup, please see the [Main Project README](../README.md).

---

## 🛠️ Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

| Variable | Description | Default |
|---|---|---|
| `VITE_API_URL` | Base API URL or Vite reverse proxy path | `/api/v1` |

### 3. Development Server
```bash
npm run dev
```
The application will be running at `http://localhost:3000`.

### 4. Build for Production
```bash
npm run build
```

### 5. Linting
```bash
npm run lint
```

---

## 📱 Features & Highlights
- **Role-Based Portals**: Dedicated views for Admins, Trainers, and Members.
- **PWA Ready**: Offline caching, installable on mobile/desktop, app manifest.
- **Dynamic QR Code Check-in**: Integrated QR generation and scanner.
- **Razorpay Checkout**: Seamless online membership subscription flow.
- **State Management**: Zustand stores for auth and persistent state.
- **Data Fetching & Cache**: TanStack React Query v5.
- **Iconography**: Lucide React.
