# 🚀 Vercel Frontend Deployment Guide

## ✅ Prerequisites (Already Done)
- [x] Backend deployed on Railway
- [x] PostgreSQL database on Railway
- [x] Code pushed to GitHub

---

## 📝 Step-by-Step Vercel Deployment

### Step 1: Import Project to Vercel

1. **Go to Vercel**: https://vercel.com/
2. **Sign in** with your GitHub account
3. Click **"Add New..."** → **"Project"**
4. **Import** your repository: `SpandanGowdaBC/opsflow-platform`

---

### Step 2: Configure Project Settings

#### Framework Preset
- Vercel should auto-detect **Next.js** ✅

#### Root Directory
⚠️ **IMPORTANT**: Set the root directory to `frontend`
- Click **"Edit"** next to Root Directory
- Enter: `frontend`
- This tells Vercel where your Next.js app is located

#### Build & Development Settings
Vercel will auto-detect these (you can leave them as default):
- **Build Command**: `npm run build` ✅
- **Output Directory**: `.next` ✅
- **Install Command**: `npm install` ✅

---

### Step 3: Set Environment Variables

Click **"Environment Variables"** and add:

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_API_URL` | `https://YOUR-RAILWAY-BACKEND-URL.up.railway.app` |

⚠️ **Replace** `YOUR-RAILWAY-BACKEND-URL` with your actual Railway backend URL

**Example**:
```
NEXT_PUBLIC_API_URL=https://opsflow-backend-production.up.railway.app
```

**Important Notes**:
- ✅ Include `https://` at the beginning
- ❌ Do NOT include `/api` at the end
- ✅ No trailing slash

---

### Step 4: Deploy

1. Click **"Deploy"**
2. Wait for the build to complete (2-3 minutes)
3. ✅ You'll see "Congratulations!" when done

---

### Step 5: Get Your Vercel URL

After deployment completes:
1. Copy your Vercel URL (e.g., `https://opsflow-platform.vercel.app`)
2. Click **"Visit"** to test the frontend

---

### Step 6: Update Railway CORS Settings

Now that you have your Vercel URL, update Railway:

1. **Go to Railway**: https://railway.app/
2. **Open your backend service**
3. **Variables** tab
4. **Update** `FRONTEND_URL`:
   ```
   FRONTEND_URL=https://YOUR-VERCEL-URL.vercel.app
   ```
5. Railway will automatically redeploy (takes ~1 minute)

---

## ✅ Verification Checklist

After both deployments are complete:

### 1. Test Backend Health
Visit: `https://YOUR-RAILWAY-BACKEND-URL.up.railway.app/api/health`

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2026-02-13T..."
}
```

### 2. Test Frontend
Visit: `https://YOUR-VERCEL-URL.vercel.app`

You should see:
- ✅ OpsFlow login page loads
- ✅ No console errors (press F12 to check)

### 3. Test Login
Use demo credentials:
- **Email**: `admin@zencare.com`
- **Password**: `admin123`

You should:
- ✅ Successfully log in
- ✅ See the dashboard with data
- ✅ No "Failed to fetch" errors

---

## 🐛 Troubleshooting

### Issue: "Failed to fetch" or CORS errors

**Cause**: Frontend can't connect to backend

**Solutions**:
1. Check `NEXT_PUBLIC_API_URL` in Vercel matches your Railway URL exactly
2. Check `FRONTEND_URL` in Railway matches your Vercel URL exactly
3. Ensure both URLs use `https://`
4. Check Railway logs for CORS errors

**How to check Vercel environment variables**:
- Go to Vercel Dashboard → Your Project → Settings → Environment Variables

**How to check Railway environment variables**:
- Go to Railway Dashboard → Your Service → Variables tab

---

### Issue: Build fails on Vercel

**Common causes**:
1. **Root directory not set**: Make sure it's set to `frontend`
2. **Missing dependencies**: Check build logs for npm errors
3. **TypeScript errors**: Check build logs for type errors

**How to view build logs**:
- Vercel Dashboard → Deployments → Click on failed deployment → View logs

---

### Issue: Login page loads but login fails

**Cause**: Backend not responding or database not seeded

**Solutions**:
1. Check backend health endpoint (see Verification #1 above)
2. Check Railway logs for errors
3. Ensure database was seeded with demo data

**How to seed database**:
```bash
# Option 1: Railway CLI
railway run node backend/seed_zencare.js

# Option 2: Direct connection (from your local machine)
cd backend
node seed_zencare.js
```

---

### Issue: Dashboard is empty after login

**Cause**: Database not seeded

**Solution**: Run the seed script (see above)

---

## 🎯 Custom Domain (Optional)

Want a custom domain like `opsflow.yourdomain.com`?

1. **Vercel Dashboard** → Your Project → **Settings** → **Domains**
2. Add your custom domain
3. Update DNS records as instructed by Vercel
4. **Update Railway** `FRONTEND_URL` to your new domain

---

## 📊 Final URLs to Update in README

After successful deployment, update your `README.md`:

```markdown
## 🌐 Live Demo
- **Frontend**: https://opsflow-platform.vercel.app
- **Backend API**: https://opsflow-backend-production.up.railway.app
- **Demo Credentials**:
  - Email: admin@zencare.com
  - Password: admin123
```

---

## 🔄 Redeployment

### Automatic Redeployment
Both Vercel and Railway will automatically redeploy when you push to GitHub:
- Push to `main` branch → Auto-deploy ✅

### Manual Redeployment
**Vercel**:
- Dashboard → Deployments → Click "..." → Redeploy

**Railway**:
- Dashboard → Service → Deployments → Click "..." → Redeploy

---

## 🎉 Success Criteria

You're successfully deployed when:
- ✅ Frontend loads at your Vercel URL
- ✅ Backend health check returns 200 OK
- ✅ Login works with demo credentials
- ✅ Dashboard shows ZenCare data (leads, bookings, etc.)
- ✅ No console errors in browser
- ✅ No CORS errors

---

**Estimated Time**: 10 minutes
**Difficulty**: Easy 🟢

Good luck! 🚀
