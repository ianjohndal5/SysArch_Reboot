import './index.css';
import './App.css';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/auth-context';
// Layout
import Layout from './layout/layout';
// Public Pages
import Landing from './components/landing';
// Admin Components
import AdminHome from './components/admin/dashboard';
import AdminLeaderboard from './components/admin/leaderboard';
import AdminStudentlist from './components/admin/studentlist';
import AdminSitins from './components/admin/sitins';
import AdminSitinrecords from './components/admin/sitinrecords';
import AdminSitinreports from './components/admin/sitinreports';
import AdminSitinfeedbacks from './components/admin/sitinfeedbacks';
import AdminLabManagement from './components/admin/labschedules';
import AdminResources from './components/admin/resources';
import AdminEditResource from './components/admin/modals/resourceeditmodal';
import AdminUploadResource from './components/admin/modals/resourceuploadmodal';
import AdminComputerManagement from './components/admin/computermanagement';
import AdminReservationRequest from './components/admin/reservationrequest';

// Student Components
import StudentHome from './components/student/dashboard';
import StudentRuleandreg from './components/student/ruleandreg';
import StudentAnnouncement from './components/student/announcements';
import StudentHistory from './components/student/history';
import StudentResources from './components/student/resources';
import StudentReservation from './components/student/reservation';
// Shared Components
import Profile from './shared/profile';
import { useEffect } from 'react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Unauthorized = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    toast.error("You don't have permission to access this page");
  }, []);

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center p-6 bg-white rounded-lg shadow-md max-w-md">
        <h1 className="text-4xl font-bold mb-4 text-red-600">403 - Access Denied</h1>
        <p className="text-gray-600 mb-6">You don't have permission to access this page based on your account type.</p>
        <button 
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
        >
          Go Back
        </button>
      </div>
    </div>
  );
};

const RoleRedirect = ({ role }) => {
  useEffect(() => {
    toast.warn(`Redirected to your ${role} dashboard`);
  }, [role]);

  return <Navigate to={`/${role}`} replace />;
};

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/" />;
  }
  
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Show warning toast when unauthorized access is attempted
    toast.warn(`As a ${user.role}, you cannot access this page`);
    
    // Redirect to unauthorized page or their respective dashboard
    return <RoleRedirect role={user.role} />;
  }
  
  return children;
};

function App() {
  return (
    <div className="App">
      <Router>
        <AuthProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/unauthorized" element={<Unauthorized />} />
            
            {/* Student Routes */}
            <Route path="/student" element={
              <ProtectedRoute allowedRoles={['student']}>
                <Layout />
              </ProtectedRoute>
            }>
              <Route index element={<StudentHome />} />
              <Route path="rules-regulations" element={<StudentRuleandreg />} />
              <Route path="announcements" element={<StudentAnnouncement />} />
              <Route path="history" element={<StudentHistory />} />
              <Route path="resources" element={<StudentResources />} />
              <Route path="reservation" element={<StudentReservation />} />
              <Route path="profile" element={<Profile />} />
            </Route>

            {/* Admin Routes */}
            <Route path="/admin" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Layout isAdmin={true} />
              </ProtectedRoute>
            }>
              <Route index element={<AdminHome />} />
              <Route path="leaderboard" element={<AdminLeaderboard />} />
              <Route path="student-list" element={<AdminStudentlist />} />
              <Route path="sit-ins" element={<AdminSitins />} />
              <Route path="sit-in-records" element={<AdminSitinrecords />} />
              <Route path="sit-in-reports" element={<AdminSitinreports />} />
              <Route path="sit-in-feedbacks" element={<AdminSitinfeedbacks />} />
              <Route path="labschedules" element={<AdminLabManagement />} />
              <Route path="resources" element={<AdminResources />} />
                <Route path="editresource" element={<AdminEditResource />} />
                <Route path="uploadresource" element={<AdminUploadResource />} />
              <Route path="computermanagement" element={<AdminComputerManagement />} />
              <Route path="reservationrequest" element={<AdminReservationRequest />} />
              <Route path="profile" element={<Profile />} />
            </Route>

            {/* Catch-all route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </Router>
    </div>
  );
}

export default App;