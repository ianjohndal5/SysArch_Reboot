import { useState, useEffect } from 'react';
import { 
  FiSearch, 
  FiChevronLeft, 
  FiChevronRight, 
  FiBell,
  FiClock,
  FiFilter,
  FiArrowUp,
  FiArrowDown,
  FiLoader,
  FiAward
} from 'react-icons/fi';

function Sitins() {
  const [sitInsData, setSitInsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rewardLoading, setRewardLoading] = useState({});
  
  // State for filtering, sorting, and pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [labFilter, setLabFilter] = useState('all');
  const [sortConfig, setSortConfig] = useState({ 
    key: 'login_time', 
    direction: 'asc' 
  });
  
  // State for reward notification
  const [rewardNotification, setRewardNotification] = useState(null);

  const itemsPerPage = 10;

  // Fetch data from API
  useEffect(() => {
    fetchSitIns();
  }, []);
  
  const fetchSitIns = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost/sysarch_reboot/sysarch_php/sitins.php');
      if (!response.ok) {
        throw new Error('Failed to fetch sit-ins data');
      }
      const result = await response.json();
      
      if (result.success && Array.isArray(result.data)) {
        setSitInsData(result.data);
      } else {
        throw new Error(result.error || 'Invalid data format');
      }
    } catch (err) {
      setError(err.message);
      setSitInsData([]);
    } finally {
      setLoading(false);
    }
  };

  // Request sort
  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Sort function
  const sortedData = [...sitInsData].sort((a, b) => {
    if (a[sortConfig.key] < b[sortConfig.key]) {
      return sortConfig.direction === 'asc' ? -1 : 1;
    }
    if (a[sortConfig.key] > b[sortConfig.key]) {
      return sortConfig.direction === 'asc' ? 1 : -1;
    }
    return 0;
  });

  // Filter sit-ins based on search term and filters
  const filteredSitIns = sortedData.filter(sitIn => {
    const matchesSearch = 
      sitIn.idno.toString().includes(searchTerm) ||
      sitIn.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sitIn.purpose.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || sitIn.status === statusFilter;
    const matchesLab = labFilter === 'all' || sitIn.labroom === labFilter;

    return matchesSearch && matchesStatus && matchesLab;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredSitIns.length / itemsPerPage);
  const currentSitIns = filteredSitIns.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Format datetime to readable time
  const formatTime = (datetime) => {
    if (!datetime) return 'N/A';
    const date = new Date(datetime);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Action handlers
  const handleNotify = (sitId) => {
    alert(`Notification sent for sit-in ${sitId}`);
  };

  const handleTimeout = async (sitId, idno) => {
    try {
        console.log('Attempting to timeout student:', { sitId, idno }); // Debug log

        // First POST request to process the timeout
        const response = await fetch('http://localhost/sysarch_reboot/sysarch_php/sitins.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                sit_id: sitId,
                idno: idno
            })
        });

        console.log('Timeout response status:', response.status); // Debug log

        // Check if the response is JSON (even for error responses)
        let result;
        try {
            result = await response.json();
            console.log('Timeout response data:', result); // Debug log
        } catch (jsonError) {
            console.error('Failed to parse JSON response:', jsonError);
            throw new Error('Server returned invalid response');
        }

        if (!response.ok) {
            // Handle HTTP errors (4xx, 5xx)
            throw new Error(result.error || `Server error: ${response.statusText}`);
        }

        if (!result.success) {
            // Handle application-level errors
            throw new Error(result.error || 'Failed to update records');
        }

        // Refresh the sit-ins list
        await fetchSitIns();
        alert('Student timed out successfully');

    } catch (err) {
        console.error('Timeout error:', err);
        alert(`Error: ${err.message}`);
    }
  };

  // New function to handle rewarding a student
  const handleRewardStudent = async (sitId, idno, studentName) => {
    try {
        // Set loading state for this specific student
        setRewardLoading(prev => ({ ...prev, [sitId]: true }));
        
        const response = await fetch('http://localhost/sysarch_reboot/sysarch_php/reward_student.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                sit_id: sitId,
                idno: idno
            })
        });

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.error || 'Failed to reward student');
        }

        // Show reward notification
        setRewardNotification({
            studentName,
            pointsAdded: result.data.points_added,
            additionalSessions: result.data.additional_sessions,
            newPoints: result.data.new_points,
            timestamp: new Date()
        });
        
        // Hide notification after 5 seconds
        setTimeout(() => {
            setRewardNotification(null);
        }, 5000);

        // No need to refresh data as we're not changing the sit-in display

    } catch (err) {
        console.error('Reward error:', err);
        alert(`Error: ${err.message}`);
    } finally {
        // Clear loading state for this specific student
        setRewardLoading(prev => ({ ...prev, [sitId]: false }));
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <FiLoader className="animate-spin text-2xl text-blue-600" />
        <span className="ml-2">Loading sit-ins data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-full text-red-600">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="bg-gray-50 p-6 h-full">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Current Sit-Ins</h1>
      
      {/* Reward Notification */}
      {rewardNotification && (
        <div className="mb-4 p-3 bg-green-100 border border-green-300 rounded-md text-green-800 flex items-center justify-between">
          <div>
            <span className="font-medium">{rewardNotification.studentName}</span> rewarded with <span className="font-medium">1 point</span>! 
            {rewardNotification.additionalSessions > 0 && (
              <span> Additionally gained <span className="font-medium">1 session</span> for reaching {rewardNotification.newPoints} points!</span>
            )}
          </div>
          <button 
            onClick={() => setRewardNotification(null)} 
            className="text-green-700 hover:text-green-900"
          >
            &times;
          </button>
        </div>
      )}
      
      {/* Filters and Search */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="relative col-span-1 md:col-span-2">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FiSearch className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search sit-ins..."
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
        
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FiFilter className="text-gray-400" />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
          >
            <option value="all">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Extended">Extended</option>
          </select>
        </div>
        
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FiFilter className="text-gray-400" />
          </div>
          <select
            value={labFilter}
            onChange={(e) => setLabFilter(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
          >
            <option value="all">All Labs</option>
            <option value="Lab 530B - Java Lab">Lab 530B - Java Lab</option>
          </select>
        </div>
      </div>

      {/* Info Bar */}
      <div className="mb-4 text-xs text-gray-600">
        Showing {currentSitIns.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}-
        {Math.min(currentPage * itemsPerPage, filteredSitIns.length)} of {filteredSitIns.length} current sit-ins
      </div>

      {/* Sit-Ins Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th 
                className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => requestSort('idno')}
              >
                <div className="flex items-center">
                  ID No
                  {sortConfig.key === 'idno' && (
                    sortConfig.direction === 'asc' ? <FiArrowUp className="ml-1" /> : <FiArrowDown className="ml-1" />
                  )}
                </div>
              </th>
              <th 
                className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => requestSort('name')}
              >
                <div className="flex items-center">
                  Name
                  {sortConfig.key === 'name' && (
                    sortConfig.direction === 'asc' ? <FiArrowUp className="ml-1" /> : <FiArrowDown className="ml-1" />
                  )}
                </div>
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Purpose</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lab Room</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th 
                className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => requestSort('login_time')}
              >
                <div className="flex items-center">
                  Login Time
                  {sortConfig.key === 'login_time' && (
                    sortConfig.direction === 'asc' ? <FiArrowUp className="ml-1" /> : <FiArrowDown className="ml-1" />
                  )}
                </div>
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentSitIns.length > 0 ? (
              currentSitIns.map((sitIn) => {
                return (
                  <tr key={sitIn.sit_id} className="hover:bg-gray-50">
                    <td className="px-3 py-4 whitespace-nowrap text-xs font-medium text-gray-900">{sitIn.idno}</td>
                    <td className="px-3 py-4 whitespace-nowrap text-xs text-gray-500">{sitIn.name}</td>
                    <td className="px-3 py-4 text-xs text-gray-500">{sitIn.purpose}</td>
                    <td className="px-3 py-4 whitespace-nowrap text-xs text-gray-500">{sitIn.labroom}</td>
                    <td className="px-3 py-4 whitespace-nowrap text-xs text-gray-500">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        sitIn.status === 'Active' ? 'bg-blue-100 text-blue-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {sitIn.status}
                      </span>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-xs text-gray-500">
                      {formatTime(sitIn.login_time)}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-xs text-gray-500">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleNotify(sitIn.sit_id)}
                          className="p-1 text-blue-600 hover:text-blue-800"
                          title="Notify Student"
                        >
                          <FiBell />
                        </button>
                        <button
                          onClick={() => handleTimeout(sitIn.sit_id, sitIn.idno)}
                          className="p-1 text-red-600 hover:text-red-800"
                          title="Logout Student"
                        >
                          <FiClock />
                        </button>
                        <button
                          onClick={() => handleRewardStudent(sitIn.sit_id, sitIn.idno, sitIn.name)}
                          className="p-1 text-yellow-500 hover:text-yellow-700"
                          title="Reward Student"
                          disabled={rewardLoading[sitIn.sit_id]}
                        >
                          {rewardLoading[sitIn.sit_id] ? (
                            <FiLoader className="animate-spin" />
                          ) : (
                            <FiAward />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="8" className="px-3 py-4 text-center text-xs text-gray-500">
                  {sitInsData.length === 0 ? 'No current sit-ins found' : 'No sit-ins match your search criteria'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <button
            onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className="flex items-center px-4 py-2 border border-gray-300 rounded-md text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiChevronLeft className="mr-1" />
            Previous
          </button>
          
          <div className="hidden sm:flex space-x-2">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`px-4 py-2 border text-xs font-medium rounded-md ${
                    currentPage === pageNum
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>
          
          <button
            onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="flex items-center px-4 py-2 border border-gray-300 rounded-md text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
            <FiChevronRight className="ml-1" />
          </button>
        </div>
      )}
    </div>
  );
}

export default Sitins;