# 🎯 Quick Vercel Deployment Reference

## 🔗 URLs You'll Need

### Your Railway Backend URL:
```
https://_____________________________.up.railway.app
```
👆 **Fill this in from your Railway dashboard**

### Your Vercel Frontend URL (after deployment):
```
https://_____________________________.vercel.app
```
👆 **You'll get this after deploying to Vercel**

---

## ⚡ 3-Minute Vercel Setup

### 1️⃣ Import to Vercel
- Go to: https://vercel.com/
- Click: **Add New** → **Project**
- Import: `SpandanGowdaBC/opsflow-platform`

### 2️⃣ Configure
- **Root Directory**: `frontend` ⚠️ IMPORTANT!
- **Framework**: Next.js (auto-detected)

### 3️⃣ Environment Variable
Add ONE environment variable:

```env
NEXT_PUBLIC_API_URL=https://YOUR-RAILWAY-URL.up.railway.app
```

### 4️⃣ Deploy
Click **Deploy** and wait 2-3 minutes ☕

### 5️⃣ Update Railway
Go back to Railway and update:
```env
FRONTEND_URL=https://YOUR-VERCEL-URL.vercel.app
```

---

## ✅ Test Login

After deployment:
1. Visit your Vercel URL
2. Login with:
   - Email: `admin@zencare.com`
   - Password: `admin123`
3. You should see the dashboard with data! 🎉

---

## 🆘 Quick Fixes

**"Failed to fetch"?**
→ Check `NEXT_PUBLIC_API_URL` in Vercel matches Railway URL

**CORS error?**
→ Check `FRONTEND_URL` in Railway matches Vercel URL

**Empty dashboard?**
→ Run: `railway run node backend/seed_zencare.js`

---

**Full Guide**: See `VERCEL_DEPLOY.md`
