# 🚀 OpsFlow Deployment Guide

## Current Deployment Status

- **Frontend**: Vercel - https://opsflow-platform-cvch.vercel.app
- **Backend**: Railway - https://opsflow-api-live.railway.app
- **Database**: Railway PostgreSQL

---

## ✅ Deployment Checklist

### Backend (Railway)

**Environment Variables Required**:
```env
DATABASE_URL=<your-railway-postgres-connection-string>
JWT_SECRET=hackathon_secret_key_change_in_production_2026
JWT_EXPIRES_IN=7d
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://opsflow-platform-cvch.vercel.app
```

**Build Settings**:
- Build Command: `cd backend && npm install && npx prisma generate`
- Start Command: `cd backend && npx prisma db push && node server.js`
- Root Directory: `/` (repository root)

---

### Frontend (Vercel)

**Environment Variables Required**:
```env
NEXT_PUBLIC_API_URL=https://opsflow-api-live.railway.app
```

**Build Settings**:
- Framework: Next.js (auto-detected)
- Root Directory: `frontend`
- Build Command: `npm run build` (auto-detected)
- Output Directory: `.next` (auto-detected)

---

## 🧪 Testing Deployment

### 1. Test Backend Health
```bash
curl https://opsflow-api-live.railway.app/health
```

Expected: JSON response with status, timestamp, and service name

### 2. Test Frontend
Visit: https://opsflow-platform-cvch.vercel.app

### 3. Test Login
- Email: `admin@zencare.com`
- Password: `admin123`

---

## 🔧 Troubleshooting

### CORS Errors
- Verify `FRONTEND_URL` in Railway matches Vercel URL exactly
- Backend automatically allows all `.vercel.app` domains for preview deployments

### Login Fails
- Check `NEXT_PUBLIC_API_URL` in Vercel is set correctly
- Verify Railway backend is running (check logs for "🚀 OpsFlow Backend Server")

### Database Errors
- Verify `DATABASE_URL` in Railway is correct
- Check Railway logs for Prisma errors

---

## 📝 Deployment Notes

- Both platforms auto-deploy on git push to `main` branch
- Railway: Redeploys take ~2-3 minutes
- Vercel: Redeploys take ~2-3 minutes
- CORS is configured to accept all Vercel preview deployments automatically
