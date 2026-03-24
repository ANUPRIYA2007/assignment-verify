# Quick Deployment Checklist ✅

## Before You Start
- [ ] Node.js and Git installed
- [ ] Project pushed to GitHub
- [ ] Supabase database created and migrations run (`RUN_THIS_IN_SUPABASE.sql`)
- [ ] Have these credentials ready:
  - Supabase URL
  - Supabase Anon Key
  - Supabase Service Role Key  
  - JWT Secret

---

## Deploy Frontend to Vercel (5 minutes)

1. [ ] Go to **https://vercel.com**
2. [ ] Sign in with GitHub
3. [ ] Click **Add New** → **Project**
4. [ ] Select `assignment-verify` repository
5. [ ] Configure:
   - Root Directory: `client`
   - Build Command: `npm run build`
   - Output Directory: `dist`
6. [ ] Add Environment Variables:
   ```
   VITE_SUPABASE_URL=<your-supabase-url>
   VITE_SUPABASE_ANON_KEY=<your-anon-key>
   VITE_API_BASE_URL=http://localhost:5000
   ```
   *(Update VITE_API_BASE_URL later after Railway deployment)*
7. [ ] Click **Deploy**
8. [ ] Copy your Vercel URL: `https://assignment-verify-xxx.vercel.app`

---

## Deploy Backend to Railway (5 minutes)

1. [ ] Go to **https://railway.app**
2. [ ] Sign in with GitHub
3. [ ] Click **+ New Project**
4. [ ] Select **Deploy from GitHub repo**
5. [ ] Select `assignment-verify` repository
6. [ ] Railway auto-detects Node.js backend
7. [ ] Set **Variables**:
   ```
   SUPABASE_URL=<your-supabase-url>
   SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
   JWT_SECRET=<your-jwt-secret>
   PORT=5000
   NODE_ENV=production
   ```
8. [ ] Copy your Railway URL (Public Domain)
   - Example: `https://assignment-verify-backend.railway.app`

---

## Update Frontend with Backend URL (2 minutes)

1. [ ] Go back to Vercel Dashboard
2. [ ] Open your project **Settings**
3. [ ] Update **Environment Variables**:
   - Change `VITE_API_BASE_URL` to your Railway URL
   - Example: `https://assignment-verify-backend-xxx.railway.app`
4. [ ] Click **Redeploy** to update

---

## Test Your Deployment ✅

1. [ ] Open frontend URL: `https://assignment-verify-xxx.vercel.app`
2. [ ] Test login/registration
3. [ ] Check browser console for errors (F12)
4. [ ] Verify API requests in Network tab point to Railway URL
5. [ ] Monitor logs:
   - Vercel: Dashboard → Function Logs
   - Railway: Service → Logs

---

## Troubleshooting Quick Links

| Issue | Solution |
|-------|----------|
| **Frontend shows blank page** | Check console (F12) for errors, verify VITE_API_BASE_URL |
| **API calls fail with 5xx errors** | Check Railway logs, verify env vars set correctly |
| **CORS errors** | Ensure backend CORS allows frontend URL |
| **Database connection fails** | Verify Supabase credentials, check migrations ran |
| **Images/assets not loading** | Check Vercel build output, ensure assets in public/ folder |

---

## After Deployment

- [ ] Set up GitHub Actions for auto-deployment (optional)
- [ ] Enable Vercel Analytics
- [ ] Set up Railway alerts for errors
- [ ] Monitor Supabase usage
- [ ] Keep dependencies updated

---

## Useful Links

- [Your GitHub Repo](https://github.com)
- [Your Vercel Project](https://vercel.com/dashboard)
- [Your Railway Project](https://railway.app/dashboard)
- [Supabase Dashboard](https://app.supabase.com)
- Full Guide: `DEPLOYMENT_GUIDE.md` in project root
