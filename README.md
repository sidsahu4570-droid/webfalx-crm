# ProspectCRM - Multi-User Call Team & Lead Intelligence Engine (MERN + TypeScript)

ProspectCRM is a modern, enterprise-grade multi-user CRM and Prospect Tracking web application designed specifically for call teams of 10+ agents/callers and team managers/admins. Built strictly with the **MERN Stack** (MongoDB, Express.js, React.js, Node.js) and end-to-end **TypeScript**.

---

## 🌟 Key Features

### 🔐 Strict Caller Data Isolation & RBAC
- **Callers/Agents**: Log in with their own email ID. Every caller gets a **private workspace** containing only their assigned prospects, call notes, and follow-ups. No caller can access or view another caller's leads or records.
- **Admins**: Possess full cross-team visibility over all callers, all prospects, caller performance leaderboards, real-time activity streams, and lead reassignment tools.

### ⚡ Live Real-Time Socket.io Sync
- Real-time updates pushed instantly via WebSocket without page refresh.
- Updates to status, latest notes, and assigned leads reflect immediately across caller and admin dashboards.
- Direct inline preview of the latest call update directly inside lead tables and cards.

### 📊 Comprehensive Analytics & Recharts
- Interactive Recharts visualization for lead status breakdown (New, Interested, Follow-up, Meeting Scheduled, Converted, Not Interested, Closed) and priority distribution.
- Admin leaderboard measuring total assigned leads vs. completed calls per caller.

### 📅 Follow-up Management System
- Urgency-highlighted due follow-up tracking with one-click completion buttons and next call date scheduling.

### 📥 CSV Import & Export Engine
- Bulk export prospect views to CSV.
- Drag-and-drop CSV lead importer with automatic column mapping and preview table.

---

## 🛠️ Technology Stack

- **Frontend**: React.js 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, Recharts, React Hook Form, Zod, Date-fns, PapaParse.
- **Backend**: Node.js 20, Express.js, TypeScript, Mongoose, Socket.io, JWT Authentication, BcryptJS, Helmet, Express Rate Limit.
- **Database**: MongoDB (Mongoose Schemas with compound indexes and text search).

---

## 📁 Repository Structure

```
CRM STEP BY STEP MERN/
├── client/
│   ├── src/
│   │   ├── components/       # Reusable UI, Lead, Admin & Chart components
│   │   ├── context/          # AuthContext, SocketContext, ThemeContext, ToastContext
│   │   ├── hooks/            # Custom hooks (useDebounce, useAuth, useTheme, etc.)
│   │   ├── layouts/          # DashboardLayout with sticky Navbar & Sidebar
│   │   ├── pages/            # Login, Signup, ForgotPassword, Dashboard, Leads, Followups, Admin pages
│   │   ├── services/         # Axios API endpoints for Auth, Leads, Users, Admin
│   │   ├── styles/           # Tailwind CSS tokens & glassmorphic styles
│   │   ├── types/            # Strict TypeScript interfaces
│   │   └── utils/            # Formatters, CSV export/import helpers
│   ├── package.json
│   └── vite.config.ts
├── server/
│   ├── src/
│   │   ├── config/           # Database & Environment configuration
│   │   ├── controllers/      # Auth, Lead, User & Admin controllers
│   │   ├── middleware/       # JWT Protect, Role Authorization, Error Handling
│   │   ├── models/           # Mongoose Schemas (User, Lead, ActivityLog)
│   │   ├── routes/           # Express API endpoints
│   │   ├── socket/           # Real-time Socket.io engine & event broadcast
│   │   ├── utils/            # JWT helpers & Database Seeder script
│   │   └── server.ts         # Main server entry point
│   ├── package.json
│   └── tsconfig.json
├── DEPLOYMENT.md             # Vercel & Render deployment guide
└── README.md
```

---

## 🚀 Quick Start Instructions

### 1. Start Backend Server
```bash
cd server
npm install
npm run dev
```
*The server will start at `http://localhost:5000` and automatically seed default admin (`admin@crm.com` / `Admin@123456`) and caller accounts into MongoDB.*

### 2. Start Frontend App
```bash
cd client
npm install
npm run dev
```
*The frontend will run at `http://localhost:5173`.*

---

## 🔒 Default Demo Credentials

- **Admin Account**: `admin@crm.com` / `Admin@123456`
- **Caller 1**: `sarah@crm.com` / `Caller@123456`
- **Caller 2**: `michael@crm.com` / `Caller@123456`
