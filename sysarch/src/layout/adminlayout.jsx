import React, { useState } from "react";
import AdminSidebar from "../shared/adminSidebar";
import AdminNavbar from "../shared/adminNavbar";
import { Outlet } from "react-router-dom";

const AdminLayout = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="flex flex-col sm:flex-row bg-gray-50 min-h-screen">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-40 transition-all duration-300 ${
        isSidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full w-0'
      }`}>
        <AdminSidebar />
      </div>
      
      {/* Main Content */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${
        isSidebarOpen ? 'ml-64' : 'ml-0'
      }`}>
        <AdminNavbar toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />
        <main className="p-6 flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;