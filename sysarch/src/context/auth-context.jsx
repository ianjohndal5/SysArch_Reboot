import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Initialize from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (credentials) => {
    const loadingAlert = Swal.fire({
      title: 'Logging in...',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
      timer: 1000
    });

    try {
      const response = await fetch(
        "http://localhost/sysarch_reboot/sysarch_php/login.php",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(credentials),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Login failed");
      }

      const userData = {
        idno: result.user.idno,
        username: result.user.username,
        role: result.user.role
      };

      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));

      setTimeout(() => {
        loadingAlert.close();
        Swal.fire({
          title: 'Success!',
          text: result.message || "Login successful!",
          icon: 'success',
          confirmButtonColor: '#3085d6',
          timer: 1000
        }).then(() => {
          navigate(userData.role === 'admin' ? '/admin' : '/student');
        });
      }, 1000);

      return true;
    } catch (error) {
      setTimeout(() => {
        loadingAlert.close();
        let errorMessage = error.message;
        if (error.message.includes("User not found")) {
          errorMessage = "Account not found. Please check your username";
        } else if (error.message.includes("Invalid password")) {
          errorMessage = "Incorrect password. Please try again";
        }
        
        Swal.fire({
          title: 'Login Failed',
          text: errorMessage,
          icon: 'error',
          confirmButtonColor: '#d33'
        });
      }, 1000);
      return false;
    }
  };

  const logout = async () => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'You will be logged out of the system',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, logout!'
    });

    if (result.isConfirmed) {
      setUser(null);
      localStorage.removeItem('user');
      navigate('/');
      await Swal.fire(
        'Logged out!',
        'You have been successfully logged out.',
        'success'
      );
    }
  };

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isStudent: user?.role === 'student'
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}