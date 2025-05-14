import { useState, useEffect } from 'react';
import { FiBell } from 'react-icons/fi';
import { format } from 'date-fns';
import { useAuth } from '../../context/auth-context';

const NotificationBell = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchNotifications = async () => {
    if (!user?.idno) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`http://localhost/sysarch_reboot/sysarch_php/notifications.php?user_id=${user.idno}`);
      const data = await response.json();
      
      if (data.success && Array.isArray(data.data)) {
        setNotifications(data.data);
        setUnreadCount(data.data.filter(n => !n.is_read).length);
      } else {
        setNotifications([]);
        setUnreadCount(0);
        if (data.error) {
          setError(data.error);
        }
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      setError('Failed to fetch notifications');
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    if (!user?.idno) return;
    
    try {
      const response = await fetch('http://localhost/sysarch_reboot/sysarch_php/notifications.php', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notification_id: notificationId,
          user_id: user.idno,
          is_read: true
        })
      });
      const data = await response.json();
      if (data.success) {
        fetchNotifications(); // Refresh notifications
      } else if (data.error) {
        setError(data.error);
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      setError('Failed to mark notification as read');
    }
  };

  useEffect(() => {
    if (user?.idno) {
      fetchNotifications();
      // Poll for new notifications every 30 seconds
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user?.idno]); // Re-run effect when user ID changes

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <FiBell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full">
            {unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg py-1 z-50">
          <div className="px-4 py-2 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800">Notifications</h3>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="px-4 py-3 text-sm text-gray-500">
                Loading notifications...
              </div>
            ) : error ? (
              <div className="px-4 py-3 text-sm text-red-500">
                {error}
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-500">
                No notifications
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.notification_id}
                  className={`px-4 py-3 hover:bg-gray-50 cursor-pointer ${
                    !notification.is_read ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => {
                    if (!notification.is_read) {
                      markAsRead(notification.notification_id);
                    }
                    if (notification.link) {
                      window.location.href = notification.link;
                    }
                  }}
                >
                  <div className="flex items-start">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {notification.title}
                      </p>
                      <p className="text-sm text-gray-500">{notification.message}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {format(new Date(notification.created_at), 'MMM d, yyyy h:mm a')}
                      </p>
                    </div>
                    {!notification.is_read && (
                      <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell; 