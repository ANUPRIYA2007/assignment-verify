# Assignment Verify - Setup & Troubleshooting Guide

## Issue: Registration Fails & Dashboard Won't Load

### Root Causes Fixed
1. ✅ **Fixed Auth Controller Bug**: Removed `.single()` method calls that were throwing errors when users didn't exist
2. ✅ **Fixed Error Handling**: Improved error messages for better debugging
3. ✅ **Server Running**: Port 5000 is now available and server is started

### Critical Setup Steps

#### Step 1: Run Supabase Database Migrations
**This is the most important step!** Your Supabase database is missing required tables and columns.

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Navigate to **SQL Editor** in your project
3. Copy the entire content from `RUN_THIS_IN_SUPABASE.sql` in this repository
4. Paste it into the SQL Editor
5. Click **Run** (or press Ctrl+Enter)

**This SQL script adds:**
- `classes_meta` table (for class management)
- `subjects` table (for subject tracking)
- `teacher_assignments` table (for teacher-class assignments)
- `gender` column to users table (for student statistics)
- `target_year` and `target_section` columns to assignments
- All necessary indexes and Row Level Security policies

**Output:** You should see "Query successful" with multiple commands executed.

#### Step 2: Verify Environment Variables
Check that your server has the correct `.env` file:

**File:** `server/.env`
```
SUPABASE_URL=https://your-supabase-url.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
JWT_SECRET=your-jwt-secret
PORT=5000
```

Ensure you're using the **Service Role Key** (not the Anon Key) for server-side operations.

#### Step 3: Restart Services

**Terminal 1 - Start Server:**
```bash
cd server
npm start
```
Server runs on: `http://localhost:5000`

**Terminal 2 - Start Client:**
```bash
cd client
npm run dev
```
Client runs on: `http://localhost:5173` (or next available port)

### Testing Registration Flow

1. Open `http://localhost:5173` in your browser
2. Click **Register**
3. Fill in all fields:
   - Full Name, Email, Password
   - Gender (Male/Female/Other)
   - **For Students:** Register Number, Year, Section
4. Click **Register**
5. You should be redirected to your dashboard

### Common Errors & Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| "Registration failed" (no details) | Supabase tables missing | Run `RUN_THIS_IN_SUPABASE.sql` |
| "Email already exists" | User registration duplicate | Clear data or verify email |
| "Can't connect to server" | Server not running | Check port 5000 is available |
| "Loading..." (spinner stuck) | Auth context issue | Check browser console errors |
| Dashboard won't load after login | Missing role permissions | Check user role is student/teacher/admin |

### Checking Server Logs

```bash
# View recent server errors
Get-Content "server\server_log.txt" -Tail 50
```

### Database Schema Check

To verify your Supabase schema is correct, check that the `users` table has these columns:
- ✅ id
- ✅ email
- ✅ password_hash
- ✅ full_name
- ✅ role
- ✅ gender ← (This should be added by RUN_THIS_IN_SUPABASE.sql)
- ✅ register_number
- ✅ year_of_study
- ✅ section
- ✅ avatar_url
- ✅ created_at
- ✅ updated_at

### Backend API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/auth/register` | POST | Register new user |
| `/api/auth/login` | POST | Login user |
| `/api/auth/profile` | GET | Get current user profile |
| `/api/auth/classes` | GET | Fetch available classes |

### Support

If issues persist:
1. ✅ Verify Supabase SQL migrations were successful
2. ✅ Confirm `.env` variables are correct
3. ✅ Check browser console for frontend errors (F12)
4. ✅ Check server terminal for backend errors
5. ✅ Verify network connectivity to Supabase

---

**Last Updated:** March 23, 2026
**Status:** Authentication bugs fixed, server running, migrations guide provided
