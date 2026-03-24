import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import RealtimeToast from './components/RealtimeToast';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './components/DashboardLayout';
import SplashScreen from './animations/SplashScreen';

// Auth pages
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';

// Student pages
import StudentDashboard from './pages/StudentDashboard';
import StudentAssignments from './pages/StudentAssignments';
import AssignmentDetail from './pages/AssignmentDetail';
import StudentSubmissions from './pages/StudentSubmissions';
import StudentResults from './pages/StudentResults';
import StudentActivities from './pages/StudentActivities';
import StudentLeaderboard from './pages/StudentLeaderboard';

// Teacher pages
import TeacherDashboard from './pages/TeacherDashboard';
import TeacherAssignments from './pages/TeacherAssignments';
import CreateAssignment from './pages/CreateAssignment';
import TeacherSubmissions from './pages/TeacherSubmissions';
import TeacherLateRequests from './pages/TeacherLateRequests';
import TeacherClassDashboard from './pages/TeacherClassDashboard';
import TeacherStudentList from './pages/TeacherStudentList';

// Admin pages
import AdminDashboard from './pages/AdminDashboard';
import AdminUsers from './pages/AdminUsers';
import AdminAssignments from './pages/AdminAssignments';
import AdminReports from './pages/AdminReports';
import AdminClassReport from './pages/AdminClassReport';
import AdminStudentReport from './pages/AdminStudentReport';
import AdminTeachers from './pages/AdminTeachers';
import AdminLeaderboard from './pages/AdminLeaderboard';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  return (
    <AuthProvider>
      <RealtimeToast />
      <Toaster position="top-right" toastOptions={{ style: { background: '#fff', color: '#1E1B3A', border: '1px solid #E5E0F6', borderRadius: 12, boxShadow: '0 4px 24px rgba(124,58,237,0.10)' } }} />
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Student routes */}
          <Route path="/student" element={<ProtectedRoute roles={['student']}><DashboardLayout /></ProtectedRoute>}>
            <Route index element={<StudentDashboard />} />
            <Route path="assignments" element={<StudentAssignments />} />
            <Route path="assignment/:id" element={<AssignmentDetail />} />
            <Route path="submissions" element={<StudentSubmissions />} />
            <Route path="results" element={<StudentResults />} />
            <Route path="activities" element={<StudentActivities />} />
            <Route path="leaderboard" element={<StudentLeaderboard />} />
          </Route>

          {/* Teacher routes */}
          <Route path="/teacher" element={<ProtectedRoute roles={['teacher']}><DashboardLayout /></ProtectedRoute>}>
            <Route index element={<TeacherDashboard />} />
            <Route path="assignments" element={<TeacherAssignments />} />
            <Route path="create" element={<CreateAssignment />} />
            <Route path="submissions" element={<TeacherSubmissions />} />
            <Route path="submissions/:assignmentId" element={<TeacherSubmissions />} />
            <Route path="late-requests" element={<TeacherLateRequests />} />
            <Route path="class/:year/:section" element={<TeacherClassDashboard />} />
            <Route path="class/:year/:section/:gender" element={<TeacherStudentList />} />
          </Route>

          {/* Admin routes */}
          <Route path="/admin" element={<ProtectedRoute roles={['admin']}><DashboardLayout /></ProtectedRoute>}>
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="assignments" element={<AdminAssignments />} />
            <Route path="reports" element={<AdminReports />} />
            <Route path="class/:year/:section" element={<AdminClassReport />} />
            <Route path="student/:studentId" element={<AdminStudentReport />} />
            <Route path="teachers" element={<AdminTeachers />} />
            <Route path="leaderboard" element={<AdminLeaderboard />} />
          </Route>

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
