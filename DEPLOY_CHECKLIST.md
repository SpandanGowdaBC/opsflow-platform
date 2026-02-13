# 🚀 Quick Deployment Checklist

## ✅ Pre-Deployment (DONE)
- [x] Code pushed to GitHub
- [x] PostgreSQL database configured on Railway
- [x] Deployment config files created
- [x] Prisma schema set to PostgreSQL

---

## 📝 Deployment Steps (DO NOW)

### Step 1: Deploy Backend to Railway (10 mins)

1. **Go to Railway**: https://railway.app/
2. **New Project** → **Deploy from GitHub repo**
3. **Select**: `SpandanGowdaBC/opsflow-platform`
4. **Configure Service**:
   - Click "Variables" tab
   - Add these environment variables:
   
   ```
   DATABASE_URL=postgresql://postgres:WbZMqUXebwTWgfZJprMicPixSFSDRccL@switchback.proxy.rlwy.net:19735/railway
   JWT_SECRET=hackathon_secret_key_change_in_production_2026
   JWT_EXPIRES_IN=7d
   NODE_ENV=production
   PORT=5000
   FRONTEND_URL=https://TEMP-will-update-later.vercel.app
   ```

5. **Settings** → Configure:
   - **Build Command**: `cd backend && npm install && npx prisma generate`
   - **Start Command**: `cd backend && npx prisma db push && node server.js`
   - **Watch Paths**: `backend/**`

6. **Deploy** → Wait for completion
7. **Copy Backend URL** (e.g., `https://opsflow-backend-production.up.railway.app`)

---

### Step 2: Deploy Frontend to Vercel (5 mins)

1. **Go to Vercel**: https://vercel.com/
2. **Add New** → **Project**
3. **Import**: `SpandanGowdaBC/opsflow-platform`
4. **Configure**:
   - **Framework**: Next.js (auto-detected)
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build` (auto)
   - **Output Directory**: `.next` (auto)

5. **Environment Variables** → Add:
   ```
   NEXT_PUBLIC_API_URL=https://YOUR-RAILWAY-BACKEND-URL.up.railway.app
   ```
   ⚠️ Replace with actual Railway URL from Step 1.7

6. **Deploy** → Wait for completion
7. **Copy Frontend URL** (e.g., `https://opsflow-platform.vercel.app`)

---

### Step 3: Update CORS (2 mins)

1. **Go back to Railway**
2. **Variables** → Update `FRONTEND_URL`:
   ```
   FRONTEND_URL=https://YOUR-VERCEL-URL.vercel.app
   ```
   ⚠️ Replace with actual Vercel URL from Step 2.7

3. Railway will auto-redeploy

---

### Step 4: Seed Database (3 mins)

**Option A: Railway CLI** (Recommended)
```bash
npm i -g @railway/cli
railway login
railway link
railway run node backend/seed_zencare.js
```

**Option B: Direct Connection**
```bash
cd backend
node seed_zencare.js
```
(Uses DATABASE_URL from your .env)

---

## ✅ Test Your Deployment

1. **Backend Health**: Visit `https://your-backend.up.railway.app/api/health`
2. **Frontend**: Visit `https://your-app.vercel.app`
3. **Login Test**:
   - Email: `admin@zencare.com`
   - Password: `admin123`
4. **Check Dashboard** for data

---

## 🎯 Final Step: Update README

Add to your README.md:

```markdown
## 🌐 Live Demo
- **Frontend**: https://your-app.vercel.app
- **Backend API**: https://your-backend.up.railway.app
- **Demo Credentials**:
  - Email: admin@zencare.com
  - Password: admin123
```

---

## 🐛 Common Issues

**"Failed to fetch"** → Check NEXT_PUBLIC_API_URL in Vercel matches Railway URL

**CORS errors** → Ensure FRONTEND_URL in Railway matches Vercel URL exactly

**Empty dashboard** → Run seed script (Step 4)

**Build fails** → Check Railway logs, ensure DATABASE_URL is correct

---

**Total Time**: ~20 minutes
**Status**: Ready to deploy! 🚀
