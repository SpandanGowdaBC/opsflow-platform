# 🚀 OpsFlow Deployment Guide

## Prerequisites
- ✅ Code pushed to GitHub: `https://github.com/SpandanGowdaBC/opsflow-platform.git`
- ✅ Railway PostgreSQL database already configured
- ✅ Accounts needed: Railway.app & Vercel.com

---

## 📋 Step-by-Step Deployment

### Part 1: Deploy Backend to Railway

#### 1.1 Create New Railway Project
1. Go to [Railway.app](https://railway.app/)
2. Click **"New Project"** → **"Deploy from GitHub repo"**
3. Select your repository: `SpandanGowdaBC/opsflow-platform`

#### 1.2 Configure Backend Service
1. Railway will detect your project
2. Click **"Add variables"** and set these environment variables:

```env
DATABASE_URL=postgresql://postgres:WbZMqUXebwTWgfZJprMicPixSFSDRccL@switchback.proxy.rlwy.net:19735/railway
JWT_SECRET=hackathon_secret_key_change_in_production_2026
JWT_EXPIRES_IN=7d
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://your-app.vercel.app
```

> **Note**: You'll update `FRONTEND_URL` after deploying the frontend in Part 2

#### 1.3 Configure Build Settings
In Railway settings:
- **Root Directory**: Leave empty (or set to `/`)
- **Build Command**: `cd backend && npm install && npx prisma generate`
- **Start Command**: `cd backend && npx prisma db push && node server.js`
- **Watch Paths**: `backend/**`

#### 1.4 Deploy
1. Click **"Deploy"**
2. Wait for deployment to complete
3. Copy your backend URL (e.g., `https://opsflow-backend-production.up.railway.app`)

---

### Part 2: Deploy Frontend to Vercel

#### 2.1 Import Project to Vercel
1. Go to [Vercel.com](https://vercel.com/)
2. Click **"Add New"** → **"Project"**
3. Import your GitHub repository: `SpandanGowdaBC/opsflow-platform`

#### 2.2 Configure Build Settings
- **Framework Preset**: Next.js
- **Root Directory**: `frontend`
- **Build Command**: `npm run build` (auto-detected)
- **Output Directory**: `.next` (auto-detected)
- **Install Command**: `npm install` (auto-detected)

#### 2.3 Set Environment Variables
Add this environment variable in Vercel:

```env
NEXT_PUBLIC_API_URL=https://your-railway-backend-url.up.railway.app
```

Replace with your actual Railway backend URL from Step 1.4

#### 2.4 Deploy
1. Click **"Deploy"**
2. Wait for deployment to complete
3. Copy your frontend URL (e.g., `https://opsflow-platform.vercel.app`)

---

### Part 3: Update CORS Configuration

#### 3.1 Update Backend Environment
1. Go back to Railway
2. Update the `FRONTEND_URL` environment variable with your Vercel URL:
   ```env
   FRONTEND_URL=https://opsflow-platform.vercel.app
   ```
3. Railway will automatically redeploy

---

### Part 4: Initialize Database

#### 4.1 Seed Production Database
You have two options:

**Option A: Using Railway CLI** (Recommended)
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Link to your project
railway link

# Run seed script
railway run node backend/seed_zencare.js
```

**Option B: Using Direct Connection**
```bash
# Set DATABASE_URL temporarily
$env:DATABASE_URL="postgresql://postgres:WbZMqUXebwTWgfZJprMicPixSFSDRccL@switchback.proxy.rlwy.net:19735/railway"

# Run seed from backend directory
cd backend
node seed_zencare.js
```

---

## ✅ Verification Checklist

After deployment, verify:

- [ ] Backend is running: Visit `https://your-backend-url.up.railway.app/api/health`
- [ ] Frontend loads: Visit `https://your-app.vercel.app`
- [ ] Login works with demo credentials:
  - Email: `admin@zencare.com`
  - Password: `admin123`
- [ ] Dashboard displays data
- [ ] API calls work (check browser console for errors)

---

## 🐛 Troubleshooting

### Frontend shows "Failed to fetch"
- Check that `NEXT_PUBLIC_API_URL` in Vercel matches your Railway backend URL
- Ensure Railway backend `FRONTEND_URL` matches your Vercel URL
- Check Railway logs for CORS errors

### Backend won't start
- Verify `DATABASE_URL` is correct in Railway
- Check Railway logs for Prisma errors
- Ensure `npx prisma db push` ran successfully

### Database is empty
- Run the seed script (Part 4)
- Check Railway logs for seed errors

---

## 📊 Production URLs

After deployment, update your README.md with:

```markdown
## 🌐 Live Demo
- **Frontend**: https://your-app.vercel.app
- **Backend API**: https://your-backend.up.railway.app
- **Demo Credentials**:
  - Email: admin@zencare.com
  - Password: admin123
```

---

## 🔒 Security Notes

Before final submission:
1. Change `JWT_SECRET` to a secure random string
2. Consider using Railway's secret management
3. Enable HTTPS only in production
4. Review CORS settings

---

**Deployment Time Estimate**: 15-20 minutes

Good luck with your hackathon submission! 🚀
