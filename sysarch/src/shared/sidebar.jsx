import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from '../context/auth-context';
import { 
  FiHome, FiUsers, FiCalendar, FiFileText, FiBarChart2, FiMessageSquare,
  FiBook, FiBell, FiClock, FiChevronLeft, FiChevronRight, FiAward, FiBookOpen,
  FiChevronDown, FiMonitor, FiList, FiCpu, FiArchive, FiDatabase, FiServer,
  FiLayout, FiClipboard, FiActivity
} from 'react-icons/fi';
import { useEffect } from 'react';

function Sidebar({ isCollapsed, toggleCollapse }) {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isAttendanceOpen, setIsAttendanceOpen] = useState(false);
  const [isLabManagementOpen, setIsLabManagementOpen] = useState(false);

  // Check if any attendance-related page is active
  const isAttendanceActive = 
    location.pathname === '/admin/sit-ins' || 
    location.pathname === '/admin/sit-in-records' || 
    location.pathname === '/admin/sit-in-reports' ||
    location.pathname === '/admin/sit-in-feedbacks';

  // Check if any lab management-related page is active
  const isLabManagementActive = 
    location.pathname === '/admin/labschedules' || 
    location.pathname === '/admin/computermanagement' || 
    location.pathname === '/admin/reservationrequest' ||
    location.pathname === '/admin/activity-logs';

  // Automatically open dropdowns if on a related page
  useEffect(() => {
    if (isAttendanceActive && !isAttendanceOpen) {
      setIsAttendanceOpen(true);
    }
    if (isLabManagementActive && !isLabManagementOpen) {
      setIsLabManagementOpen(true);
    }
  }, [location.pathname, isAttendanceActive, isLabManagementActive]);

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

  // Toggle dropdowns
  const toggleAttendanceDropdown = () => {
    if (!isCollapsed) {
      setIsAttendanceOpen(!isAttendanceOpen);
    }
  };

  const toggleLabManagementDropdown = () => {
    if (!isCollapsed) {
      setIsLabManagementOpen(!isLabManagementOpen);
    }
  };

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
            
            {/* Dropdown for Attendance Section */}
            <li className="relative">
              <button
                onClick={toggleAttendanceDropdown}
                className={`flex items-center text-white p-3 rounded-lg transition-all duration-200 w-full
                  hover:bg-blue-800 hover:shadow-md
                  ${isAttendanceActive ? 'bg-blue-800 shadow-md' : ''}
                  ${isCollapsed ? 'justify-center' : 'justify-between'}`}
              >
                <div className="flex items-center">
                  <span className="text-xl"><FiMonitor /></span>
                  {!isCollapsed && (
                    <span className="ml-3 whitespace-nowrap transition-opacity duration-200">
                      Sitin System
                    </span>
                  )}
                </div>
                {!isCollapsed && (
                  <FiChevronDown className={`transition-transform duration-200 ${isAttendanceOpen ? 'transform rotate-180' : ''}`} />
                )}
              </button>
              
              {/* Dropdown Items */}
              {(isAttendanceOpen || isCollapsed) && (
                <ul className={`mt-1 ml-${isCollapsed ? '0' : '4'} space-y-1`}>
                  <DropdownItem 
                    to="/admin/sit-ins"
                    icon={<FiCalendar />}
                    label="Current Sit-Ins"
                    isCollapsed={isCollapsed}
                    isActive={location.pathname === '/admin/sit-ins'}
                  />
                  <DropdownItem 
                    to="/admin/sit-in-records"
                    icon={<FiFileText />}
                    label="Attendance Records"
                    isCollapsed={isCollapsed}
                    isActive={location.pathname === '/admin/sit-in-records'}
                  />
                  <DropdownItem 
                    to="/admin/sit-in-reports"
                    icon={<FiBarChart2 />}
                    label="Generate Reports"
                    isCollapsed={isCollapsed}
                    isActive={location.pathname === '/admin/sit-in-reports'}
                  />
                  <DropdownItem 
                    to="/admin/sit-in-feedbacks"
                    icon={<FiMessageSquare />}
                    label="Student Feedbacks"
                    isCollapsed={isCollapsed}
                    isActive={location.pathname === '/admin/sit-in-feedbacks'}
                  />
                </ul>
              )}
            </li>

            {/* NEW DROPDOWN: Lab Management Section */}
            <li className="relative">
              <button
                onClick={toggleLabManagementDropdown}
                className={`flex items-center text-white p-3 rounded-lg transition-all duration-200 w-full
                  hover:bg-blue-800 hover:shadow-md
                  ${isLabManagementActive ? 'bg-blue-800 shadow-md' : ''}
                  ${isCollapsed ? 'justify-center' : 'justify-between'}`}
              >
                <div className="flex items-center">
                  <span className="text-xl"><FiServer /></span>
                  {!isCollapsed && (
                    <span className="ml-3 whitespace-nowrap transition-opacity duration-200">
                      Lab Management
                    </span>
                  )}
                </div>
                {!isCollapsed && (
                  <FiChevronDown className={`transition-transform duration-200 ${isLabManagementOpen ? 'transform rotate-180' : ''}`} />
                )}
              </button>
              
              {/* Lab Management Dropdown Items */}
              {(isLabManagementOpen || isCollapsed) && (
                <ul className={`mt-1 ml-${isCollapsed ? '0' : '4'} space-y-1`}>
                  <DropdownItem 
                    to="/admin/labschedules"
                    icon={<FiLayout />}
                    label="Lab Schedules"
                    isCollapsed={isCollapsed}
                    isActive={location.pathname === '/admin/labschedules'}
                  />
                  <DropdownItem 
                    to="/admin/computermanagement"
                    icon={<FiDatabase />}
                    label="Computer Management"
                    isCollapsed={isCollapsed}
                    isActive={location.pathname === '/admin/computermanagement'}
                  />
                  <DropdownItem 
                    to="/admin/reservationrequest"
                    icon={<FiClipboard />}
                    label="Reservation Request"
                    isCollapsed={isCollapsed}
                    isActive={location.pathname === '/admin/reservationrequest'}
                  />
                  <DropdownItem 
                    to="/admin/activity-logs"
                    icon={<FiActivity />}
                    label="Activity Logs"
                    isCollapsed={isCollapsed}
                    isActive={location.pathname === '/admin/activity-logs'}
                  />
                </ul>
              )}
            </li>
            
            <SidebarItem 
              to="/admin/resources" 
              icon={<FiBookOpen />}
              label="Resources"
              isCollapsed={isCollapsed}
              isActive={location.pathname === '/admin/resources'}
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
            <SidebarItem 
              to="/student/resources" 
              icon={<FiBookOpen />}
              label="Resources"
              isCollapsed={isCollapsed}
              isActive={location.pathname === '/student/resources'}
            />
            <SidebarItem 
              to="/student/reservation" 
              icon={<FiClipboard />}
              label="Reservation"
              isCollapsed={isCollapsed}
              isActive={location.pathname === '/student/reservation'}
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

function DropdownItem({ to, icon, label, isCollapsed, isActive }) {
  return (
    <li>
      <Link 
        to={to}
        className={`flex items-center text-white p-2 rounded-lg transition-all duration-200
          hover:bg-blue-900 hover:shadow-md
          ${isActive ? 'bg-blue-900 shadow-md' : ''}
          ${isCollapsed ? 'justify-center' : 'justify-start'}`}
      >
        <span className="text-lg">{icon}</span>
        {!isCollapsed && (
          <span className="ml-3 whitespace-nowrap transition-opacity duration-200 text-sm">
            {label}
          </span>
        )}
      </Link>
    </li>
  );
}

export default Sidebar;