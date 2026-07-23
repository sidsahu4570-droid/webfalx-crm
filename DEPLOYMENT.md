# Deployment Guide - ProspectCRM (MERN + TypeScript)

This guide provides step-by-step instructions for deploying ProspectCRM to production using **Vercel** (Frontend) and **Render / Railway** (Backend Server + MongoDB Atlas).

---

## 1. MongoDB Atlas Setup

1. Create a free cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Under **Network Access**, allow IP `0.0.0.0/0` (or Render/Railway server IPs).
3. Under **Database Access**, create a user with readWrite privileges.
4. Copy your MongoDB Connection String URI:
   ```env
   mongodb+srv://<username>:<password>@cluster0.mongodb.net/crm_production?retryWrites=true&w=majority
   ```

---

## 2. Backend Deployment (Render / Railway / Node Server)

### Render.com Deployment Steps:

1. Create a new **Web Service** on Render and link your GitHub repository.
2. Set **Root Directory**: `server`
3. Set **Build Command**: `npm install && npm run build`
4. Set **Start Command**: `npm start`
5. Configure Environment Variables in Render Dashboard:

| Variable | Recommended Value | Description |
|---|---|---|
| `NODE_ENV` | `production` | Production environment flag |
| `PORT` | `5000` (or $PORT) | Server listener port |
| `MONGODB_URI` | `mongodb+srv://...` | MongoDB Atlas URI |
| `JWT_SECRET` | `your_random_32_char_secret_key` | Secret key for signing JWTs |
| `JWT_EXPIRES_IN` | `7d` | Token lifetime |
| `CLIENT_URL` | `https://your-app-frontend.vercel.app` | Production frontend domain |

6. Deploy the web service. Render will build TypeScript files into `dist/` and run `npm start`.

---

## 3. Frontend Deployment (Vercel)

### Vercel Deployment Steps:

1. Create a new project on [Vercel](https://vercel.com) and link your GitHub repository.
2. Set **Root Directory**: `client`
3. Set **Framework Preset**: `Vite`
4. Set **Build Command**: `npm run build`
5. Set **Output Directory**: `dist`
6. Add Environment Variables in Vercel Dashboard:

| Variable | Value | Description |
|---|---|---|
| `VITE_API_URL` | `https://your-backend-api.onrender.com/api` | Production backend API endpoint |
| `VITE_SOCKET_URL` | `https://your-backend-api.onrender.com` | Production Socket.io WebSocket server |

7. Deploy to Vercel.

---

## 4. Default Seeded Admin & Callers Credentials

When the server starts up for the first time, the database seeder automatically initializes the following default accounts if none exist:

### Admin Account:
- **Email**: `admin@crm.com`
- **Password**: `Admin@123456`
- **Access**: Full system control, caller account creation, reassign leads, audit logs.

### Sample Callers:
- **Caller 1**: `sarah@crm.com` / `Caller@123456`
- **Caller 2**: `michael@crm.com` / `Caller@123456`
- **Caller 3**: `david@crm.com` / `Caller@123456`
