import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { FiBell, FiCalendar, FiFilter, FiPlus, FiChevronLeft, FiChevronRight, FiHeart, FiMessageSquare } from 'react-icons/fi';
import { Chart } from 'chart.js/auto';

function AdminDashboard() {
  const location = useLocation();
  const [activeFilter, setActiveFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [stats, setStats] = useState({
    currentSitins: 0,
    totalStudents: 0,
    totalSitins: 0,
    activeStudents: 0,
    inactiveStudents: 0
  });
  const [weeklyData, setWeeklyData] = useState([0, 0, 0, 0, 0, 0, 0]);
  const [days] = useState(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    content: '',
    target: 'all'
  });
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  const sitInsChartRef = useRef(null);
  const studentsChartRef = useRef(null);

  // Fetch dashboard stats
  const fetchStats = async () => {
    try {
      const response = await fetch('http://localhost/sysarch_reboot/sysarch_php/dashboard_stats.php');
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      
      if (data.success) {
        setStats(data.stats);
        setWeeklyData(data.weeklyData);
      } else {
        throw new Error(data.error || 'Failed to fetch stats');
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      setError(error.message);
    }
  };

  // Fetch announcements
  const fetchAnnouncements = async () => {
    try {
      const response = await fetch(
        `http://localhost/sysarch_reboot/sysarch_php/announcements.php?filter=${activeFilter}`
      );
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      
      if (data.success) {
        setAnnouncements(data.announcements);
      } else {
        throw new Error(data.error || 'Failed to fetch announcements');
      }
    } catch (error) {
      console.error('Error fetching announcements:', error);
      setError(error.message);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchStats();
      await fetchAnnouncements();
      setLoading(false);
    };
    
    loadData();
  }, []);

  useEffect(() => {
    if (loading) return;

    const initCharts = () => {
      if (sitInsChartRef.current) {
        sitInsChartRef.current.destroy();
      }
      if (studentsChartRef.current) {
        studentsChartRef.current.destroy();
      }

      // Current Sit-Ins Bar Chart
      const sitInsCtx = document.getElementById('sitInsChart');
      if (sitInsCtx) {
        sitInsChartRef.current = new Chart(sitInsCtx, {
          type: 'bar',
          data: {
            labels: days,
            datasets: [{
              label: 'Sit-Ins This Week',
              data: weeklyData,
              backgroundColor: 'rgba(59, 130, 246, 0.7)',
              borderColor: 'rgba(59, 130, 246, 1)',
              borderWidth: 1
            }]
          },
          options: {
            responsive: true,
            plugins: {
              legend: {
                position: 'top',
              },
              tooltip: {
                callbacks: {
                  label: function(context) {
                    return `${context.dataset.label}: ${context.raw}`;
                  }
                }
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                ticks: {
                  precision: 0
                }
              }
            }
          }
        });
      }

      // Students Pie Chart
      const studentsCtx = document.getElementById('studentsChart');
      if (studentsCtx) {
        studentsChartRef.current = new Chart(studentsCtx, {
          type: 'pie',
          data: {
            labels: ['Active Students (In Lab)', 'Inactive Students'],
            datasets: [{
              data: [stats.activeStudents, stats.inactiveStudents],
              backgroundColor: [
                'rgba(16, 185, 129, 0.7)',
                'rgba(239, 68, 68, 0.7)'
              ],
              borderColor: [
                'rgba(16, 185, 129, 1)',
                'rgba(239, 68, 68, 1)'
              ],
              borderWidth: 1
            }]
          },
          options: {
            responsive: true,
            plugins: {
              legend: {
                position: 'top',
              },
              tooltip: {
                callbacks: {
                  label: function(context) {
                    const label = context.label || '';
                    const value = context.raw || 0;
                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                    const percentage = Math.round((value / total) * 100);
                    return `${label}: ${value} (${percentage}%)`;
                  }
                }
              }
            }
          }
        });
      }
    };

    initCharts();

    return () => {
      if (sitInsChartRef.current) {
        sitInsChartRef.current.destroy();
      }
      if (studentsChartRef.current) {
        studentsChartRef.current.destroy();
      }
    };
  }, [loading, weeklyData, days, stats.activeStudents, stats.inactiveStudents]);

  useEffect(() => {
    fetchAnnouncements();
  }, [activeFilter]);

  const handleCreateAnnouncement = async () => {
    try {
      const response = await fetch('http://localhost/sysarch_reboot/sysarch_php/announcements.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: newAnnouncement.title,
          content: newAnnouncement.content,
          target: newAnnouncement.target
        }),
      });
  
      const data = await response.json();
  
      if (data.success) {
        setAnnouncements([data.announcement, ...announcements]);
        setNewAnnouncement({ title: '', content: '', target: 'all' });
        setShowAnnouncementForm(false);
      } else {
        throw new Error(data.error || 'Failed to create announcement');
      }
    } catch (error) {
      console.error('Error creating announcement:', error);
      setError(error.message);
    }
  };

  const handleEditAnnouncement = async (updatedAnnouncement) => {
    try {
      const response = await fetch('http://localhost/sysarch_reboot/sysarch_php/announcements.php', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedAnnouncement),
      });

      const data = await response.json();

      if (data.success) {
        setAnnouncements(announcements.map(ann => 
          ann.id === data.announcement.id ? data.announcement : ann
        ));
        setEditingAnnouncement(null);
        setIsEditing(false);
        setShowAnnouncementForm(false);
      } else {
        throw new Error(data.error || 'Failed to update announcement');
      }
    } catch (error) {
      console.error('Error updating announcement:', error);
      setError(error.message);
    }
  };

  const handleDeleteAnnouncement = async (id) => {
    if (!window.confirm('Are you sure you want to delete this announcement?')) {
      return;
    }

    try {
      const response = await fetch('http://localhost/sysarch_reboot/sysarch_php/announcements.php', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      });

      const data = await response.json();

      if (data.success) {
        setAnnouncements(announcements.filter(ann => ann.id !== id));
      } else {
        throw new Error(data.error || 'Failed to delete announcement');
      }
    } catch (error) {
      console.error('Error deleting announcement:', error);
      setError(error.message);
    }
  };

  const handleLike = async (announcementId) => {
    try {
      const response = await fetch('http://localhost/sysarch_reboot/sysarch_php/announcements.php', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          announcement_id: announcementId,
          user_id: 1, // Replace with actual user ID from your auth system
        }),
      });

      const data = await response.json();

      if (data.success) {
        setAnnouncements(announcements.map(ann => {
          if (ann.id === announcementId) {
            return { ...ann, likes: data.likeCount };
          }
          return ann;
        }));
      } else {
        throw new Error(data.error || 'Failed to update like');
      }
    } catch (error) {
      console.error('Error updating like:', error);
      setError(error.message);
    }
  };

  const startEditing = (announcement) => {
    setEditingAnnouncement(announcement);
    setIsEditing(true);
    setShowAnnouncementForm(true);
  };

  const filteredAnnouncements = announcements.filter(announcement => {
    if (activeFilter === 'all') return true;
    return announcement.target === activeFilter;
  });

  const itemsPerPage = 3;
  const totalPages = Math.ceil(filteredAnnouncements.length / itemsPerPage);
  const paginatedAnnouncements = filteredAnnouncements.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (loading) {
    return (
      <div className="bg-gray-50 p-6 w-full min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-50 p-6 w-full min-h-screen flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 max-w-md">
          <h2 className="text-xl font-bold text-red-600 mb-4">Error Loading Dashboard</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 p-6 w-full min-h-screen">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Admin Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-gray-500 text-sm font-medium">Current Sit-Ins</h3>
          <p className="text-3xl font-bold text-blue-600 mt-2">{stats.currentSitins}</p>
          <p className="text-green-500 text-sm mt-1">Currently in labs</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-gray-500 text-sm font-medium">Registered Students</h3>
          <p className="text-3xl font-bold text-green-600 mt-2">{stats.totalStudents}</p>
          <p className="text-blue-500 text-sm mt-1">Total students</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-gray-500 text-sm font-medium">Total Sit-Ins</h3>
          <p className="text-3xl font-bold text-purple-600 mt-2">{stats.totalSitins}</p>
          <p className="text-yellow-500 text-sm mt-1">All-time records</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-gray-700 font-medium mb-4">Sit-Ins This Week</h3>
          <canvas id="sitInsChart" height="300"></canvas>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-gray-700 font-medium mb-4">Student Status</h3>
          <canvas id="studentsChart" height="300"></canvas>
        </div>
      </div>

      {/* Announcements Section */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800 flex items-center">
            <FiBell className="mr-2 text-blue-500" />
            Announcements
          </h2>

          <div className="flex space-x-4">
            <div className="relative">
              <select
                value={activeFilter}
                onChange={(e) => {
                  setActiveFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="appearance-none bg-gray-50 border border-gray-300 text-gray-700 py-2 px-4 pr-8 rounded leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="all">All</option>
                <option value="students">Students</option>
                <option value="admin">Staff</option>
              </select>
              <FiFilter className="absolute right-3 top-2.5 text-gray-400" />
            </div>

            <button
              onClick={() => {
                setShowAnnouncementForm(true);
                setIsEditing(false);
                setEditingAnnouncement(null);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded flex items-center text-sm"
            >
              <FiPlus className="mr-1" />
              Create
            </button>
          </div>
        </div>

        {/* Announcement Form */}
        {showAnnouncementForm && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-800 mb-3">
              {isEditing ? 'Edit Announcement' : 'Create New Announcement'}
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={isEditing ? editingAnnouncement.title : newAnnouncement.title}
                  onChange={(e) => isEditing 
                    ? setEditingAnnouncement({...editingAnnouncement, title: e.target.value})
                    : setNewAnnouncement({...newAnnouncement, title: e.target.value})
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Announcement title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                <textarea
                  value={isEditing ? editingAnnouncement.content : newAnnouncement.content}
                  onChange={(e) => isEditing
                    ? setEditingAnnouncement({...editingAnnouncement, content: e.target.value})
                    : setNewAnnouncement({...newAnnouncement, content: e.target.value})
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="3"
                  placeholder="Announcement content"
                ></textarea>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Target Audience</label>
                <select
                  value={isEditing ? editingAnnouncement.target : newAnnouncement.target}
                  onChange={(e) => isEditing
                    ? setEditingAnnouncement({...editingAnnouncement, target: e.target.value})
                    : setNewAnnouncement({...newAnnouncement, target: e.target.value})
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Everyone</option>
                  <option value="students">Students Only</option>
                  <option value="admin">Staff Only</option>
                </select>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowAnnouncementForm(false);
                    setIsEditing(false);
                    setEditingAnnouncement(null);
                  }}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={() => isEditing 
                    ? handleEditAnnouncement(editingAnnouncement)
                    : handleCreateAnnouncement()
                  }
                  disabled={
                    isEditing 
                      ? !editingAnnouncement.title || !editingAnnouncement.content
                      : !newAnnouncement.title || !newAnnouncement.content
                  }
                  className={`px-4 py-2 text-sm text-white rounded-md ${
                    (isEditing 
                      ? !editingAnnouncement.title || !editingAnnouncement.content
                      : !newAnnouncement.title || !newAnnouncement.content)
                    ? 'bg-blue-300 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {isEditing ? 'Update Announcement' : 'Post Announcement'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Announcements List */}
        <div className="space-y-4">
          {paginatedAnnouncements.length > 0 ? (
            paginatedAnnouncements.map(announcement => (
              <div key={announcement.id} className="border-b border-gray-100 pb-4 last:border-0">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-gray-800">{announcement.title}</h3>
                    <p className="text-gray-600 text-sm mt-1">{announcement.content}</p>
                    <p className="text-gray-400 text-xs mt-2">
                      Posted by: {announcement.author_name || 'System'}
                    </p>
                    <div className="flex items-center mt-2 space-x-4">
                      <button 
                        onClick={() => handleLike(announcement.id)}
                        className="flex items-center text-sm text-gray-500 hover:text-red-500"
                      >
                        <FiHeart className="mr-1" />
                        {announcement.likes} Likes
                      </button>
                      <button className="flex items-center text-sm text-gray-500 hover:text-blue-500">
                        <FiMessageSquare className="mr-1" />
                        {announcement.comments} Comments
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-col items-end space-y-2">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => startEditing(announcement)}
                        className="text-gray-500 hover:text-blue-600"
                        title="Edit"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteAnnouncement(announcement.id)}
                        className="text-gray-500 hover:text-red-600"
                        title="Delete"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                        {announcement.target === 'all' ? 'All' : announcement.target === 'students' ? 'Students' : 'Staff'}
                      </span>
                      <span className="text-gray-400 text-sm">
                        <FiCalendar className="inline mr-1" />
                        {new Date(announcement.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-center py-4">No announcements found</p>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center mt-6">
            <button
              onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className={`flex items-center text-sm py-1 px-3 rounded ${currentPage === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-600 hover:text-blue-600 hover:bg-gray-100'}`}
            >
              <FiChevronLeft className="mr-1" />
              Previous
            </button>

            <span className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className={`flex items-center text-sm py-1 px-3 rounded ${currentPage === totalPages ? 'text-gray-400 cursor-not-allowed' : 'text-gray-600 hover:text-blue-600 hover:bg-gray-100'}`}
            >
              Next
              <FiChevronRight className="ml-1" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;