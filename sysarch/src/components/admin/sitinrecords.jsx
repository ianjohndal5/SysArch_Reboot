import { useState, useEffect, useRef } from 'react';
import { 
  FiSearch, 
  FiChevronLeft, 
  FiChevronRight, 
  FiFilter,
  FiCalendar,
  FiClock
} from 'react-icons/fi';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

function SitinRecords() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [labFilter, setLabFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('today');
  const [viewMode, setViewMode] = useState('current'); // 'current' or 'history'
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Refs for charts
  const labChartRef = useRef(null);
  const purposeChartRef = useRef(null);

  // Fetch data from API based on view mode
  useEffect(() => {
    const fetchRecords = async () => {
      try {
        setLoading(true);
        let url = viewMode === 'current' 
          ? 'http://localhost/sysarch_reboot/sysarch_php/active_sitins.php'
          : 'http://localhost/sysarch_reboot/sysarch_php/sitins_history.php';
        
        // Add date filter for history view
        if (viewMode === 'history' && dateFilter !== 'all') {
          url += `?date=${dateFilter}`;
        }

        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch records');
        
        const result = await response.json();
        
        if (result.success) {
          setRecords(result.data);
        } else {
          throw new Error(result.error || 'Invalid data format');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRecords();
  }, [viewMode, dateFilter]);

  // Initialize/update charts when records change
  useEffect(() => {
    if (records.length === 0) return;

    // Destroy existing charts
    if (labChartRef.current) labChartRef.current.destroy();
    if (purposeChartRef.current) purposeChartRef.current.destroy();

    // Lab Room Distribution Chart
    const labRoomCtx = document.getElementById('labRoomChart');
    const labCounts = records.reduce((acc, record) => {
      acc[record.labroom] = (acc[record.labroom] || 0) + 1;
      return acc;
    }, {});

    labChartRef.current = new Chart(labRoomCtx, {
      type: 'bar',
      data: {
        labels: Object.keys(labCounts),
        datasets: [{
          label: 'Usage by Lab Room',
          data: Object.values(labCounts),
          backgroundColor: 'rgba(54, 162, 235, 0.7)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: { beginAtZero: true }
        }
      }
    });

    // Purpose Distribution Chart
    const purposeCtx = document.getElementById('purposeChart');
    const purposeCounts = records.reduce((acc, record) => {
      acc[record.purpose] = (acc[record.purpose] || 0) + 1;
      return acc;
    }, {});

    purposeChartRef.current = new Chart(purposeCtx, {
      type: 'pie',
      data: {
        labels: Object.keys(purposeCounts),
        datasets: [{
          data: Object.values(purposeCounts),
          backgroundColor: [
            'rgba(255, 99, 132, 0.7)',
            'rgba(54, 162, 235, 0.7)',
            'rgba(255, 206, 86, 0.7)',
            'rgba(75, 192, 192, 0.7)'
          ],
          borderWidth: 1
        }]
      }
    });

    // Cleanup function
    return () => {
      if (labChartRef.current) labChartRef.current.destroy();
      if (purposeChartRef.current) purposeChartRef.current.destroy();
    };
  }, [records]);

  // Filter records
  const filteredRecords = records.filter(record => {
    const matchesSearch = 
      record.idno.toString().includes(searchTerm) ||
      record.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.purpose.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesLab = labFilter === 'all' || record.labroom === labFilter;

    return matchesSearch && matchesLab;
  });

  // Pagination
  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage);
  const paginatedRecords = filteredRecords.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Get unique dates for filter
  const uniqueDates = [...new Set(records.map(r => r.day))].sort((a, b) => 
    new Date(b) - new Date(a)
  );

  // Format time
  const formatTime = (datetime) => {
    if (!datetime) return 'N/A';
    const date = new Date(datetime);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Calculate duration in minutes
  const calculateDuration = (login, logout) => {
    if (!login || !logout) return 0;
    const diff = new Date(logout) - new Date(login);
    return Math.round(diff / 60000);
  };

  // Handle timeout
  const handleTimeout = async (sitId, idno) => {
    try {
      const response = await fetch('http://localhost/sysarch_reboot/sysarch_php/sitins.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sit_id: sitId, idno })
      });

      if (!response.ok) throw new Error('Failed to process timeout');
      
      const result = await response.json();
      if (result.success) {
        // Refresh current view
        const refresh = await fetch('http://localhost/sysarch_reboot/sysarch_php/active_sitins.php');
        const data = await refresh.json();
        setRecords(data.data);
      }
    } catch (err) {
      console.error('Timeout error:', err);
      alert(`Error: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
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
    <div className="p-6">
      <h1 className="text-xl font-bold mb-6">Sit-In Records</h1>
      
      {/* View Mode Toggle */}
      <div className="flex mb-4">
        <button
          onClick={() => setViewMode('current')}
          className={`px-4 py-2 mr-2 rounded ${viewMode === 'current' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        >
          Current Sit-Ins
        </button>
        <button
          onClick={() => setViewMode('history')}
          className={`px-4 py-2 rounded ${viewMode === 'history' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        >
          Historical Records
        </button>
      </div>
      
      {/* Charts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-medium mb-2">Lab Room Usage</h3>
          <canvas id="labRoomChart" height="200"></canvas>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-medium mb-2">Purpose Distribution</h3>
          <canvas id="purposeChart" height="200"></canvas>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-2">
          <div className="relative">
            <FiSearch className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search records..."
              className="pl-10 pr-4 py-2 w-full border rounded"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>
        
        <div className="relative">
          <FiFilter className="absolute left-3 top-3 text-gray-400" />
          <select
            className="pl-10 pr-4 py-2 w-full border rounded"
            value={labFilter}
            onChange={(e) => setLabFilter(e.target.value)}
          >
            <option value="all">All Labs</option>
            {[...new Set(records.map(r => r.labroom))].map(lab => (
              <option key={lab} value={lab}>{lab}</option>
            ))}
          </select>
        </div>
        
        {viewMode === 'history' && (
          <div className="relative">
            <FiCalendar className="absolute left-3 top-3 text-gray-400" />
            <select
              className="pl-10 pr-4 py-2 w-full border rounded"
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="today">Today</option>
              <option value="all">All Dates</option>
              {uniqueDates.map(date => (
                <option key={date} value={date}>
                  {new Date(date).toLocaleDateString()}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Records Table */}
      <div className="bg-white rounded shadow overflow-hidden mb-4">
        <table className="min-w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 text-left text-xs">Student ID</th>
              <th className="px-4 py-2 text-left text-xs">Name</th>
              <th className="px-4 py-2 text-left text-xs">Purpose</th>
              <th className="px-4 py-2 text-left text-xs">Lab Room</th>
              <th className="px-4 py-2 text-left text-xs">Status</th>
              <th className="px-4 py-2 text-left text-xs">Login Time</th>
              <th className="px-4 py-2 text-left text-xs">Logout Time</th>
              <th className="px-4 py-2 text-left text-xs">Duration</th>
              {viewMode === 'current' && (
                <th className="px-4 py-2 text-left text-xs">Actions</th>
              )}
            </tr>
          </thead>
          <tbody>
            {paginatedRecords.length > 0 ? (
              paginatedRecords.map(record => {
                const duration = calculateDuration(record.login_time, record.logout_time);
                const isActive = !record.logout_time;
                
                return (
                  <tr key={record.sit_id} className="border-t hover:bg-gray-50 text-xs">
                    <td className="px-4 py-3">{record.idno}</td>
                    <td className="px-4 py-3">{record.name}</td>
                    <td className="px-4 py-3">{record.purpose}</td>
                    <td className="px-4 py-3">{record.labroom}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full ${
                        isActive ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {isActive ? 'Active' : 'Logged Out'}
                      </span>
                    </td>
                    <td className="px-4 py-3">{formatTime(record.login_time)}</td>
                    <td className="px-4 py-3">{formatTime(record.logout_time)}</td>
                    <td className="px-4 py-3">
                      {duration > 0 ? `${duration} mins` : 'N/A'}
                    </td>
                    {viewMode === 'current' && (
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleTimeout(record.sit_id, record.idno)}
                          className="p-1 text-red-600 hover:text-red-800"
                          title="Logout Student"
                        >
                          <FiClock />
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={viewMode === 'current' ? 9 : 8} className="px-4 py-4 text-center text-gray-500">
                  {records.length === 0 ? 'No records found' : 'No records match your filters'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {filteredRecords.length > 0 && (
        <div className="flex justify-between items-center">
          <button
            onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className="flex items-center px-4 py-2 border rounded disabled:opacity-50"
          >
            <FiChevronLeft className="mr-1" /> Previous
          </button>
          
          <span className="text-sm">Page {currentPage} of {totalPages}</span>
          
          <button
            onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="flex items-center px-4 py-2 border rounded disabled:opacity-50"
          >
            Next <FiChevronRight className="ml-1" />
          </button>
        </div>
      )}
    </div>
  );
}

export default SitinRecords;