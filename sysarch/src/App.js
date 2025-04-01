import './index.css';
import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './shared/navbar';
import Listuser from './components/list';
import Landing from './components/landing';
import Createuser from './components/create';
import StudentDashboard from './components/student/dashboard';
import { useLocation } from 'react-router-dom';
import ProtectedRoute from './components/protected';

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </div>
  );
}

function AppContent() {
  const location = useLocation();
  
  return (
    <>
      {/* Show Navbar only if not on the Landing page */}
      {location.pathname !== "/" && <Navbar />}
      
      <Routes>
        <Route index element={<Landing />} />
        
        {/* All protected routes nested under this */}
        <Route element={<ProtectedRoute />}>
          <Route path="user/register" element={<Createuser />} />
          <Route path="user/list" element={<Listuser />} />
          <Route path="student/dashboard" element={<StudentDashboard />} />
        </Route>
      </Routes>
    </>
  );
}

export default App;