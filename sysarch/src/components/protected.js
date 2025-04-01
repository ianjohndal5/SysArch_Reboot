// src/components/ProtectedRoute.js
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import Swal from 'sweetalert2';
import { useEffect } from 'react';

const ProtectedRoute = () => {
  const location = useLocation();
  const isLoggedIn = localStorage.getItem('user');

  useEffect(() => {
    if (!isLoggedIn && location.pathname !== '/') {
      Swal.fire({
        title: 'Access Denied',
        text: 'Please login to access this page',
        icon: 'error',
        confirmButtonColor: '#d33'
      });
    }
  }, [isLoggedIn, location.pathname]);

  return isLoggedIn ? <Outlet /> : <Navigate to="/" replace />;
};

export default ProtectedRoute;