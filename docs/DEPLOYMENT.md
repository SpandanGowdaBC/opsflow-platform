# 🚀 Global Deployment Guide - Render & Vercel

This guide outlines the production deployment strategy for the **OpsFlow Unified Operations Platform**.

---

## 🏗️ Architecture Overview
OpsFlow is built with a decoupled architecture for maximum scalability:
- **Frontend**: Next.js (Deployed on Vercel)
- **Backend**: Node.js / Express (Deployed on Render)
- **Database**: PostgreSQL (Managed on Render)
- **Real-time**: Socket.IO

---

## ⚡ Production Deployment (Step-by-Step)

### 1. Database & Backend (Render.com)
1. **Create PostgreSQL Database**: 
   - New -> PostgreSQL.
   - Name: `opsflow-db`.
   - Plan: Free (or higher).
2. **Create Web Service**:
   - New -> Web Service -> Connect GitHub Repository.
   - **Name**: `opsflow-backend`.
   - **Runtime**: Node.
   - **Root Directory**: `backend`.
   - **Build Command**: `npm install && npx prisma generate`.
   - **Start Command**: `npx prisma db push && node seed_cloud_init.js && node seed_demo_data.js && node server.js`.
3. **Environment Variables**:
   - `DATABASE_URL`: Your PostgreSQL Internal Database URL.
   - `JWT_SECRET`: A secure random string.
   - `FRONTEND_URL`: Your Vercel deployment URL (e.g., `https://opsflow.vercel.app`).
   - `NODE_ENV`: `production`.

### 2. Frontend (Vercel)
1. **Connect Repo**: New Project -> Import Repository.
2. **Configure**:
   - **Framework Preset**: Next.js.
   - **Root Directory**: `frontend`.
3. **Environment Variables**:
   - `NEXT_PUBLIC_API_URL`: Your Render Web Service URL (e.g., `https://opsflow-backend.onrender.com`).
4. **Deploy**: Vercel will build and host your Next.js application.

---

## 🔐 Critical Production Checklist

1. **CORS Configuration**: Ensure the `FRONTEND_URL` in the Backend settings exactly matches your Vercel URL.
2. **Prisma Generation**: Always run `npx prisma generate` in the build step to ensure the client is up to date.
3. **Seeding**: The `seed_demo_data.js` script is used to populate the "Operational Brain" dashboard for demo purposes.
4. **WebSockets**: Socket.IO is configured to work cross-origin between Render and Vercel.

---
**OpsFlow**: Unified. Scalable. Production-Ready.
