import React, { useState } from "react";
import Sidebar from "../shared/sidebar";
import Navbar from "../shared/navbar";
import { Outlet } from "react-router-dom";
import { useAuth } from "../context/auth-context";

const Layout = ({ isAdmin = false }) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const { user } = useAuth();

  const sidebarWidth = isSidebarCollapsed ? '80px' : '250px'; // Dynamically calculate sidebar width
  const contentMargin = isSidebarCollapsed ? '80px' : '250px'; // Dynamically adjust content margin

  // Function to toggle sidebar state
  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <div className="flex bg-gray-50 min-h-screen">
      {/* Sidebar */}
      {user && (
        <div 
          style={{
            width: sidebarWidth,
            transition: 'width 0.3s ease-in-out',
          }}
          className="fixed h-full z-20 bg-gradient-to-b from-blue-600 to-blue-700"
        >
          <Sidebar 
            isAdmin={isAdmin} 
            isCollapsed={isSidebarCollapsed} 
            toggleCollapse={toggleSidebar} // Pass toggle function to Sidebar
          />
        </div>
      )}
      
      {/* Main Content Area */}
      <div 
        style={{
          marginLeft: contentMargin,
          transition: 'margin-left 0.3s ease-in-out',
        }}
        className="flex-1 flex flex-col"
      >
        {/* Navbar */}
        {user && (
          <div 
            style={{
              marginLeft: contentMargin,
              transition: 'margin-left 0.3s ease-in-out',
            }}
            className="fixed top-0 right-0 z-10 bg-white w-full shadow-md"
          >
            <Navbar 
              toggleSidebar={toggleSidebar} 
              isSidebarCollapsed={isSidebarCollapsed} 
              isAdmin={isAdmin} 
            />
          </div>
        )}
        
        {/* Page Content */}
        <main 
          style={{
            marginTop: user ? '64px' : '0',
          }}
          className="flex-1 overflow-auto"
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
