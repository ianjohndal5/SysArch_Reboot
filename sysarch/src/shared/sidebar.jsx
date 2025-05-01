import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from '../context/auth-context';
import { 
  FiHome, FiUsers, FiCalendar, FiFileText, FiBarChart2, FiMessageSquare,
  FiBook, FiBell, FiClock, FiChevronLeft, FiChevronRight, FiAward
} from 'react-icons/fi';
import { useEffect } from 'react';

function Sidebar({ isCollapsed, toggleCollapse }) {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Redirect if no user is logged in
  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  if (!user) return null;

  // Determine admin status based on user role
  const isAdmin = user?.role === 'admin';
  const expandedWidth = "250px";
  const collapsedWidth = "80px";

  return (
    <div 
      style={{
        width: isCollapsed ? collapsedWidth : expandedWidth,
        transition: 'width 0.3s ease-in-out',
      }}
      className="p-4 min-h-screen fixed top-0 left-0 z-20 bg-gradient-to-b from-blue-600 to-blue-700"
    >
      <button 
        onClick={toggleCollapse}
        className="absolute -right-3 top-20 bg-white p-1 rounded-full shadow-md hover:bg-gray-100 transition-colors"
      >
        {isCollapsed ? <FiChevronRight className="text-blue-600" /> : <FiChevronLeft className="text-blue-600" />}
      </button>

      <div className="overflow-hidden">
      {isAdmin ? (
          <ul className="flex flex-col space-y-2">
            <SidebarItem 
              to="/admin" 
              icon={<FiHome />}
              label="Dashboard"
              isCollapsed={isCollapsed}
              isActive={location.pathname === '/admin'}
            />
            <SidebarItem 
              to="/admin/student-list" 
              icon={<FiUsers />}
              label="Student Management"
              isCollapsed={isCollapsed}
              isActive={location.pathname === '/admin/student-list'}
            />
            <SidebarItem 
              to="/admin/leaderboard" 
              icon={<FiAward />}
              label="Leaderboard"
              isCollapsed={isCollapsed}
              isActive={location.pathname.startsWith('/admin/leaderboard')}
            />
            <SidebarItem 
              to="/admin/sit-ins"      
              icon={<FiCalendar />}
              label="Current Sit-Ins"
              isCollapsed={isCollapsed}
              isActive={location.pathname === '/admin/sit-ins'}
            />
            <SidebarItem 
              to="/admin/sit-in-records" 
              icon={<FiFileText />}
              label="Attendance Records"
              isCollapsed={isCollapsed}
              isActive={location.pathname === '/admin/sit-in-records'}
            />
            <SidebarItem 
              to="/admin/sit-in-reports" 
              icon={<FiBarChart2 />}
              label="Generate Reports"
              isCollapsed={isCollapsed}
              isActive={location.pathname === '/admin/sit-in-reports'}
            />
            <SidebarItem 
              to="/admin/sit-in-feedbacks" 
              icon={<FiMessageSquare />}
              label="Student Feedbacks"
              isCollapsed={isCollapsed}
              isActive={location.pathname === '/admin/sit-in-feedbacks'}
            />
            <SidebarItem 
              to="/admin/labschedules" 
              icon={<FiClock />}
              label="Lab Schedules"
              isCollapsed={isCollapsed}
              isActive={location.pathname === '/admin/labschedules'}
            />
          </ul>
        ) : (
          <ul className="flex flex-col space-y-2">
            <SidebarItem 
              to="/student" 
              icon={<FiHome />}
              label="My Dashboard"
              isCollapsed={isCollapsed}
              isActive={location.pathname === '/student'}
            />
            <SidebarItem 
              to="/student/rules-regulations"  
              icon={<FiBook />}
              label="Lab Rules"
              isCollapsed={isCollapsed}
              isActive={location.pathname === '/student/rules-regulations'}
            />
            <SidebarItem 
              to="/student/announcements" 
              icon={<FiBell />}
              label="Announcements"
              isCollapsed={isCollapsed}
              isActive={location.pathname === '/student/announcements'}
            />
            <SidebarItem 
              to="/student/history" 
              icon={<FiClock />}
              label="My History"
              isCollapsed={isCollapsed}
              isActive={location.pathname === '/student/history'}
            />
          </ul>
        )}
      </div>
    </div>
  );
}

function SidebarItem({ to, icon, label, isCollapsed, isActive }) {
  return (
    <li>
      <Link 
        to={to}
        className={`flex items-center text-white p-3 rounded-lg transition-all duration-200
          hover:bg-blue-800 hover:shadow-md
          ${isActive ? 'bg-blue-800 shadow-md' : ''}
          ${isCollapsed ? 'justify-center' : 'justify-start'}`}
      >
        <span className="text-xl">{icon}</span>
        {!isCollapsed && (
          <span className="ml-3 whitespace-nowrap transition-opacity duration-200">
            {label}
          </span>
        )}
      </Link>
    </li>
  );
}

export default Sidebar;