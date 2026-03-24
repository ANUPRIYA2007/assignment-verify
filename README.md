# Online Assignment Submission & Evaluation System

A full-stack web application for managing assignments, MCQ tests, and evaluations with role-based access for Students, Teachers, and Admins.

## 🚀 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + Vite + Tailwind CSS |
| Backend | Node.js + Express |
| Database | Supabase (PostgreSQL) |
| Auth | JWT + bcrypt |
| Animations | Three.js + GSAP |
| File Upload | Multer |

## 📋 Features

### Student
- View/submit assignments (file upload or MCQ)
- MCQ tests with countdown timer + auto-submit
- Late submission detection with reason form
- View results after publish date
- View feedback from teachers

### Teacher
- Create assignments (file upload / MCQ type)
- Dynamic MCQ question builder (4 options + correct answer)
- Set deadline, marks, duration, result publish date
- View & evaluate submissions inline
- Approve/reject late submission reasons
- Auto-evaluate MCQ tests

### Admin
- Dashboard with platform statistics
- Manage users (change roles, delete)
- Control assignment visibility
- View reports & analytics

## 🛠️ Setup

### 1. Database Setup (Supabase)
Go to your Supabase dashboard → SQL Editor → Run the contents of `supabase/schema.sql`

### 2. Backend
```bash
cd server
npm install
# Edit .env with your Supabase credentials
npm run dev
```
Server runs on `http://localhost:5000`

### 3. Frontend
```bash
cd client
npm install
npm run dev
```
App runs on `http://localhost:5173`

## 📁 Project Structure

```
├── client/src/
│   ├── animations/      # Three.js particle background
│   ├── components/      # Sidebar, ProtectedRoute, DashboardLayout
│   ├── context/         # AuthContext (JWT)
│   ├── lib/             # Axios API client
│   └── pages/           # 15 route pages
├── server/
│   ├── config/          # Supabase client
│   ├── controllers/     # 5 MVC controllers
│   ├── middleware/       # JWT auth + multer upload
│   ├── routes/          # 5 REST route files
│   └── server.js        # Express entry point
└── supabase/
    └── schema.sql       # Database migration
```

## 🔐 Environment Variables

**server/.env:**
```
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
JWT_SECRET=your_jwt_secret
PORT=5000
```
