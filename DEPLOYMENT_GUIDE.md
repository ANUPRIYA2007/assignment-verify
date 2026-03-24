# Deployment Guide: Vercel + Railway

This guide explains how to deploy your application to Vercel (frontend) and Railway (backend).

## Prerequisites

- GitHub account ([github.com](https://github.com))
- Vercel account ([vercel.com](https://vercel.com))
- Railway account ([railway.app](https://railway.app))
- Git installed locally

---

## Step 1: Push Project to GitHub

### 1.1 Initialize Git (if not already done)
```bash
cd "c:\Users\hp\Downloads\assignment-verify-main (1)\assignment-verify-main"
git init
git add .
git commit -m "Initial commit: Assignment Verify app with frontend and backend"
```

### 1.2 Create a GitHub Repository
1. Go to [GitHub.com](https://github.com)
2. Click **New Repository**
3. Name it: `assignment-verify`
4. Add description: `Online Assignment Submission and Verification System`
5. Click **Create Repository**

### 1.3 Push to GitHub
```bash
git remote add origin https://github.com/YOUR_USERNAME/assignment-verify.git
git branch -M main
git push -u origin main
```

---

## Step 2: Deploy Frontend to Vercel

### 2.1 Connect GitHub to Vercel
1. Go to [Vercel.com](https://vercel.com)
2. Click **Sign Up** or **Sign In** with GitHub
3. Click **Add New** → **Project**
4. Select your **assignment-verify** repository
5. Click **Import**

### 2.2 Configure Build Settings
- **Framework Preset**: Vite
- **Root Directory**: `client`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

### 2.3 Set Environment Variables
Add these in Vercel dashboard under **Settings** → **Environment Variables**:

```
VITE_SUPABASE_URL=https://your-supabase-url.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_BASE_URL=https://assignment-verify-backend.railway.app
```

**Where to find:**
- `SUPABASE_URL` & `SUPABASE_ANON_KEY`: Supabase Dashboard → Project Settings → API
- `VITE_API_BASE_URL`: Use the Railway backend URL (deployed in Step 3)

### 2.4 Deploy
Click **Deploy** and wait for completion. Your frontend will be live at `https://assignment-verify-xxx.vercel.app`

---

## Step 3: Deploy Backend to Railway

### 3.1 Connect GitHub to Railway
1. Go to [Railway.app](https://railway.app)
2. Sign in with GitHub
3. Click **+ New Project**
4. Select **Deploy from GitHub repo**
5. Select your **assignment-verify** repository

### 3.2 Configure Server Deployment
1. Railway will auto-detect the Node.js backend
2. Select the service and go to **Settings**
3. Set **Root Directory** to `./server`
4. Ensure **Start Command** is `node server.js`

### 3.3 Set Environment Variables in Railway
Go to **Variables** and add:

```
SUPABASE_URL=https://your-supabase-url.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
JWT_SECRET=your-jwt-secret
PORT=5000
NODE_ENV=production
```

**Important Notes:**
- Use **Service Role Key** (not Anon Key) for backend
- Get keys from Supabase Dashboard → Project Settings → API
- `PORT` should be `5000` or leave for Railway to assign

### 3.4 Deploy
Railway automatically builds and deploys when you push to GitHub. The backend will be available at `https://assignment-verify-backend.railway.app` (or similar Railway subdomain)

---

## Step 4: Update Frontend API Configuration

After Railway deployment, update your frontend to use the correct backend URL.

### 4.1 Get Railway Backend URL
1. Go to Railway dashboard
2. Open your backend service
3. Copy the **Public Domain** URL (looks like `https://assignment-verify-backend.railway.app`)

### 4.2 Update Vercel Environment Variable
1. Go to Vercel dashboard
2. Open your project
3. Go to **Settings** → **Environment Variables**
4. Update `VITE_API_BASE_URL` to your Railway domain
5. Redeploy by pushing a commit or clicking **Redeploy**

### 4.3 Update Client API Configuration (Optional)
Check `client/src/lib/api.js` and ensure it uses the environment variable:

```javascript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
```

---

## Step 5: Test Your Deployment

### 5.1 Frontend Tests
- Visit your Vercel URL: `https://assignment-verify-xxx.vercel.app`
- Test login/registration
- Check that animations and UI load properly

### 5.2 Backend Tests
- Test API endpoints from the frontend
- Check Network tab in DevTools to ensure requests go to Railway URL
- Monitor logs in Railway dashboard for errors

### 5.3 Database Verification
- Check Supabase dashboard for new records
- Verify JWT tokens are working

---

## Troubleshooting

### Frontend stuck on loading screen
- Check browser console for errors (F12 → Console)
- Verify `VITE_API_BASE_URL` is correctly set in Vercel
- Check Network tab to see if API requests are failing

### Backend returning 500 errors
- Check Railway logs: Dashboard → Service → Logs
- Verify environment variables are set in Railway
- Ensure Supabase credentials are correct

### CORS errors
- Verify backend has CORS enabled in `server.js`
- Check that frontend URL is whitelisted (if needed)

### Database connection issues
- Verify `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in Railway
- Run the SQL migrations in Supabase if not done: `RUN_THIS_IN_SUPABASE.sql`

---

## Important Environment Variables Reference

### Client (.env / Vercel)
```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_API_BASE_URL
```

### Server (.env / Railway)
```
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
JWT_SECRET
PORT
NODE_ENV
```

---

## Next Steps

1. ✅ Push to GitHub
2. ✅ Deploy frontend to Vercel
3. ✅ Deploy backend to Railway
4. ✅ Configure environment variables
5. ✅ Test the application
6. Monitor logs in Vercel and Railway dashboards
7. Set up GitHub Actions for CI/CD (optional)

---

## Additional Resources

- [Vercel Docs](https://vercel.com/docs)
- [Railway Docs](https://docs.railway.app)
- [Supabase Docs](https://supabase.com/docs)
- [Vite Guide](https://vitejs.dev)
