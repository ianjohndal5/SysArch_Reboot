import React, { useState, useEffect } from 'react';
import { FiSearch, FiFilter, FiCalendar, FiClock, FiUser, FiTag, FiInfo } from 'react-icons/fi';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

const ActivityLogs = () => {
  // State for logs and filters
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    total_pages: 0
  });

  // State for filters
  const [filters, setFilters] = useState({
    search: '',
    start_date: null,
    end_date: null,
    action_type: '',
    user_id: '',
    reservation_id: ''
  });

  // Action type options
  const actionTypes = [
    { value: '', label: 'All Actions' },
    { value: 'new_request', label: 'New Request' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'completed', label: 'Completed' },
    { value: 'modified', label: 'Modified' }
  ];

  // Fetch logs from API
  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Construct query parameters
      const queryParams = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit
      });
      
      // Add filters to query params
      if (filters.search) queryParams.append('search', filters.search);
      if (filters.start_date) queryParams.append('start_date', filters.start_date.toISOString().split('T')[0]);
      if (filters.end_date) queryParams.append('end_date', filters.end_date.toISOString().split('T')[0]);
      if (filters.action_type) queryParams.append('action_type', filters.action_type);
      if (filters.user_id) queryParams.append('user_id', filters.user_id);
      if (filters.reservation_id) queryParams.append('reservation_id', filters.reservation_id);
      
      const response = await fetch(`http://localhost/sysarch_reboot/sysarch_php/activity_logs.php?${queryParams.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch logs');
      }
      
      const result = await response.json();
      
      if (result.success) {
        setLogs(result.data.logs);
        setPagination(prev => ({
          ...prev,
          total: result.data.pagination.total,
          total_pages: result.data.pagination.total_pages
        }));
      } else {
        throw new Error(result.error || 'Failed to fetch logs');
      }
    } catch (err) {
      console.error('Error fetching logs:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle filter changes
  const handleFilterChange = (name, value) => {
    setFilters(prev => ({ ...prev, [name]: value }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page when filters change
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  // Effect to fetch logs when filters or pagination changes
  useEffect(() => {
    fetchLogs();
  }, [filters, pagination.page, pagination.limit]);

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  // Get status badge color
  const getStatusBadgeColor = (status) => {
    const colors = {
      new_request: 'bg-blue-100 text-blue-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800',
      completed: 'bg-purple-100 text-purple-800',
      modified: 'bg-yellow-100 text-yellow-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Activity Logs</h1>
      
      {/* Filters Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 mb-6">
        <h2 className="text-lg font-medium text-gray-700 mb-4 flex items-center">
          <FiFilter className="mr-2" />
          Filters
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search logs..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 p-2 pl-9"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="text-gray-400" />
              </div>
            </div>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <div className="relative">
              <DatePicker
                selected={filters.start_date}
                onChange={(date) => handleFilterChange('start_date', date)}
                className="w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 p-2"
                placeholderText="Select start date"
                maxDate={filters.end_date || new Date()}
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <FiCalendar className="text-gray-400" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <div className="relative">
              <DatePicker
                selected={filters.end_date}
                onChange={(date) => handleFilterChange('end_date', date)}
                className="w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 p-2"
                placeholderText="Select end date"
                minDate={filters.start_date}
                maxDate={new Date()}
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <FiCalendar className="text-gray-400" />
              </div>
            </div>
          </div>

          {/* Action Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Action Type
            </label>
            <select
              value={filters.action_type}
              onChange={(e) => handleFilterChange('action_type', e.target.value)}
              className="w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 p-2"
            >
              {actionTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* User ID */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              User ID
            </label>
            <input
              type="text"
              placeholder="Enter user ID"
              value={filters.user_id}
              onChange={(e) => handleFilterChange('user_id', e.target.value)}
              className="w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 p-2"
            />
          </div>

          {/* Reservation ID */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reservation ID
            </label>
            <input
              type="text"
              placeholder="Enter reservation ID"
              value={filters.reservation_id}
              onChange={(e) => handleFilterChange('reservation_id', e.target.value)}
              className="w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 p-2"
            />
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-4 text-center text-gray-600">Loading...</div>
        ) : error ? (
          <div className="p-4 text-center text-red-600">{error}</div>
        ) : logs.length === 0 ? (
          <div className="p-4 text-center text-gray-600">No logs found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Performed By
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {logs.map((log) => (
                  <tr key={log.log_id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatTimestamp(log.timestamp)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(log.action_type)}`}>
                        {log.action_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {log.affected_user}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {log.action_by}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {log.action_details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && !error && logs.length > 0 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.total_pages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing{' '}
                  <span className="font-medium">
                    {((pagination.page - 1) * pagination.limit) + 1}
                  </span>
                  {' '}to{' '}
                  <span className="font-medium">
                    {Math.min(pagination.page * pagination.limit, pagination.total)}
                  </span>
                  {' '}of{' '}
                  <span className="font-medium">{pagination.total}</span>
                  {' '}results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  {/* Add page numbers here if needed */}
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.total_pages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityLogs; 