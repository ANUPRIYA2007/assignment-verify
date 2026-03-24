# Backend Deployment to Vercel

## Step 1: Create Separate Vercel Project for Backend

Since your backend is in the same repository, you'll deploy it as a separate Vercel project.

### Option A: Deploy via Vercel Dashboard (Recommended for separate project)

1. **Go to Vercel Dashboard**: https://vercel.com/dashboard
2. **Click "Add New"** → **Project**
3. **Select your repository**: `assignment-verify`
4. **Configure Root Directory**: 
   - Root Directory: `server`
5. **Add Environment Variables**:
   ```
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   JWT_SECRET=your-jwt-secret
   NODE_ENV=production
   PORT=3000
   ```
6. **Click Deploy**

Your backend API will get a URL like: `https://assignment-verify-backend.vercel.app`

---

## Step 2: Update Frontend API URL

After backend is deployed, update your frontend environment variables:

**In Vercel Dashboard** → Your frontend project → **Settings** → **Environment Variables**:

Update `VITE_API_BASE_URL`:
```
VITE_API_BASE_URL=https://assignment-verify-backend.vercel.app
```

Then reduce and wait for auto-deployment, or manually redeploy.

---

## Step 3: Test Backend API

### Health Check
```bash
curl https://assignment-verify-backend.vercel.app/api/health
```

Expected response:
```json
{
  "status": "ok",
  "message": "Assignment Verify API is running.",
  "timestamp": "2026-03-24T03:36:18.000Z"
}
```

### Login Test
```bash
curl -X POST https://assignment-verify-backend.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
```

---

## Step 4: Verify Frontend-Backend Connectivity

1. Open your frontend: https://evalyn-assignment-verify.vercel.app
2. Try logging in
3. Check browser DevTools (F12):
   - Network tab: See requests going to Vercel backend
   - Console: Check for any CORS or connection errors
4. Verify data appears (if you have test users in database)

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| **502 Bad Gateway** | Check environment variables in Vercel dashboard, verify SUPABASE_SERVICE_ROLE_KEY is correct |
| **CORS errors** | Check `api/index.js` CORS configuration includes your frontend URL |
| **Timeout errors** | Vercel serverless functions have 30-60s limit; verify database queries are performant |
| **404 Not Found** | Verify `server` folder is set as root directory in Vercel settings |
| **Environment variables not loading** | Redeploy after adding/updating vars: In Vercel, go to Deployments → Click "..." → Redeploy |

---

## Summary

| Component | URL |
|-----------|-----|
| **Frontend** | https://evalyn-assignment-verify.vercel.app |
| **Backend API** | https://assignment-verify-backend.vercel.app |
| **Database** | Your Supabase project |

Both are now hosted on Vercel and connected via the API URL! 🚀
