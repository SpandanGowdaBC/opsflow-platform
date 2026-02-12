# 🚀 Global Deployment Guide

This guide outlines how to deploy the **OpsFlow Unified Operations Platform** to a production environment. 

---

## 🏗️ Architecture Overview
OpsFlow is built with a decoupled architecture:
- **Frontend**: Next.js (App Router)
- **Backend**: Node.js / Express
- **Database**: PostgreSQL (via Prisma ORM)
- **Real-time**: Socket.IO

---

## ⚡ Option 1: The "Rapid" Deployment (Vercel + Railway)
*Best for Hackathon submissions and quick demos.*

### 1. Database (Railway.app)
1. Create a new PostgreSQL database on [Railway.app](https://railway.app/).
2. Copy the **Public Connection String**.

### 2. Backend (Render.com or Railway.app)
1. Push your code to a GitHub repository.
2. Link your repo to a new "Web Service" on **Render/Railway**.
3. Set the following environment variables:
   - `DATABASE_URL`: Your PostgreSQL connection string.
   - `JWT_SECRET`: A secure random string.
   - `FRONTEND_URL`: The URL of your deployed frontend.
4. **Build Command**: `cd backend && npm install && npx prisma generate`
5. **Start Command**: `cd backend && node server.js`

### 3. Frontend (Vercel)
1. Link your repo to [Vercel](https://vercel.com/).
2. Set the Environment Variable:
   - `NEXT_PUBLIC_API_URL`: The URL of your deployed backend (e.g., `https://api.opsflow.com/api`).
3. Vercel will automatically detect Next.js and deploy.

---

## 🐳 Option 2: The "Enterprise" Deployment (Docker)
*Best for VPS, DigitalOcean, or AWS EC2.*

OpsFlow is fully Dockerized. To deploy on any Linux server:

1. **Install Docker & Docker Compose** on your server.
2. **Transfer the files** or clone your repository.
3. **Launch the stack**:
   ```bash
   docker-compose up -d --build
   ```
   *This command will pull the Postgres image, build the Node.js backend, and serve the Next.js frontend on ports 5000 and 3000.*

---

## 🔐 Critical Production Checklist

1. **Prisma Schema**: Ensure `provider = "postgresql"` is set in `backend/prisma/schema.prisma` before deploying.
2. **CORS**: Ensure the `FRONTEND_URL` in your backend `.env` matches your final deployed URL.
3. **SSL**: Ensure you are using `https` for all API calls.
4. **Database Migration**: Run `npx prisma db push` once against your production database to initialize the schema.

---
**OpsFlow**: Unified. Scalable. Production-Ready.
