import { useState, useEffect } from 'react';
import { useAuth } from '../../context/auth-context';
import { 
  FiCheck, 
  FiX, 
  FiAlertCircle, 
  FiLoader, 
  FiFilter,
  FiUserCheck,
  FiCalendar,
  FiClock,
  FiMonitor,
  FiInfo,
  FiBriefcase,
  FiEdit3,
  FiRefreshCw,
  FiSearch
} from 'react-icons/fi';

function AdminReservationRequest() {
  const { user } = useAuth();
  // State for reservations
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State for filtering
  const [filters, setFilters] = useState({
    status: 'pending', // Default to showing pending reservations
    labId: '',
    date: '',
    search: ''
  });

  // State for available labs (for filtering)
  const [labs, setLabs] = useState([]);
  const [labsLoading, setLabsLoading] = useState(true);

  // State for notes/message when approving/rejecting
  const [adminNotes, setAdminNotes] = useState('');

  // State for action in progress
  const [actionInProgress, setActionInProgress] = useState(null);

  // Fetch labs on component mount
  useEffect(() => {
    fetchLabs();
  }, []);

  // Fetch reservations when filters change
  useEffect(() => {
    fetchReservations();
  }, [filters]);

  // Fetch labs from API
  const fetchLabs = async () => {
    try {
      setLabsLoading(true);
      const response = await fetch('http://localhost/sysarch_reboot/sysarch_php/labs.php');
      
      if (!response.ok) {
        throw new Error('Failed to fetch labs');
      }
      
      const result = await response.json();
      
      if (result.success && Array.isArray(result.data)) {
        setLabs(result.data);
      } else {
        throw new Error(result.error || 'Invalid labs data format');
      }
    } catch (err) {
      console.error('Error fetching labs:', err);
      setLabs([]);
    } finally {
      setLabsLoading(false);
    }
  };

  // Fetch reservations from API
  const fetchReservations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Construct query parameters based on filters
      const queryParams = new URLSearchParams();
      
      if (filters.status) {
        queryParams.append('status', filters.status);
      }
      
      if (filters.labId) {
        queryParams.append('lab_id', filters.labId);
      }
      
      if (filters.date) {
        queryParams.append('date', filters.date);
      }
      
      // Fetch the reservations
      const url = `http://localhost/sysarch_reboot/sysarch_php/reservations.php?${queryParams.toString()}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch reservations');
      }
      
      const result = await response.json();
      
      if (result.success && Array.isArray(result.data)) {
        // If search filter is active, filter results on client side
        let filteredData = result.data;
        if (filters.search) {
          const searchTerm = filters.search.toLowerCase();
          filteredData = filteredData.filter(res => 
            res.firstname.toLowerCase().includes(searchTerm) || 
            res.lastname.toLowerCase().includes(searchTerm) || 
            res.idno.toString().includes(searchTerm) ||
            res.purpose.toLowerCase().includes(searchTerm) ||
            res.computer_name.toLowerCase().includes(searchTerm) ||
            res.lab_name.toLowerCase().includes(searchTerm)
          );
        }
        
        setReservations(filteredData);
      } else {
        throw new Error(result.error || 'Invalid reservation data format');
      }
    } catch (err) {
      console.error('Error fetching reservations:', err);
      setError(err.message || 'Failed to fetch reservations');
    } finally {
      setLoading(false);
    }
  };

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  // Handle search input
  const handleSearchChange = (e) => {
    const { value } = e.target;
    setFilters(prev => ({ ...prev, search: value }));
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({
      status: 'pending',
      labId: '',
      date: '',
      search: ''
    });
  };

  // Format date
  const formatDate = (dateString) => {
    const options = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Update logAction function
  const logAction = async (actionType, reservationId, userId, details) => {
    try {
      const response = await fetch('http://localhost/sysarch_reboot/sysarch_php/activity_logs.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reservation_id: reservationId,
          user_id: userId,
          action_type: actionType,
          action_details: details,
          performed_by: user.idno,
          performed_by_role: 'admin',
          old_status: 'pending',
          new_status: actionType === 'approved' ? 'approved' : 'rejected'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to log action');
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to log action');
      }
    } catch (err) {
      console.error('Error logging action:', err);
    }
  };

  // Handle reservation approval
  const handleApprove = async (reservationId) => {
    try {
      setActionInProgress(reservationId);
      
      // Get reservation details first
      const reservationResponse = await fetch(`http://localhost/sysarch_reboot/sysarch_php/reservations.php?reservation_id=${reservationId}`);
      const reservationResult = await reservationResponse.json();
      const reservationDetails = reservationResult.data[0];

      // Update reservation status to approved
      const response = await fetch('http://localhost/sysarch_reboot/sysarch_php/reservations.php', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reservation_id: reservationId,
          status: 'approved',
          admin_notes: adminNotes || 'Reservation approved'
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to approve reservation');
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to approve reservation');
      }

      // Log the approval action
      await logAction(
        'approved',
        reservationId,
        reservationDetails.idno,
        `Reservation approved for ${reservationDetails.firstname} ${reservationDetails.lastname}. Lab: ${reservationDetails.lab_name}, Computer: ${reservationDetails.computer_name}, Date: ${reservationDetails.reservation_date}, Time: ${reservationDetails.time_in}. Admin Notes: ${adminNotes || 'None'}`
      );
      
      // Update computer status to 'in_use' for the reserved time
      // You'll need to implement this endpoint in your PHP backend
      
      // Refresh reservations list
      fetchReservations();
      
      // Clear admin notes
      setAdminNotes('');
      
      // Show success message
      alert('Reservation approved successfully');
      
    } catch (err) {
      console.error('Error approving reservation:', err);
      alert(err.message || 'Failed to approve reservation');
    } finally {
      setActionInProgress(null);
    }
  };

  // Handle reservation rejection
  const handleReject = async (reservationId) => {
    try {
      setActionInProgress(reservationId);
      
      // Get reservation details first
      const reservationResponse = await fetch(`http://localhost/sysarch_reboot/sysarch_php/reservations.php?reservation_id=${reservationId}`);
      const reservationResult = await reservationResponse.json();
      const reservationDetails = reservationResult.data[0];

      // Update reservation status to rejected
      const response = await fetch('http://localhost/sysarch_reboot/sysarch_php/reservations.php', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reservation_id: reservationId,
          status: 'rejected',
          admin_notes: adminNotes || 'Reservation rejected'
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to reject reservation');
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to reject reservation');
      }

      // Log the rejection action
      await logAction(
        'rejected',
        reservationId,
        reservationDetails.idno,
        `Reservation rejected for ${reservationDetails.firstname} ${reservationDetails.lastname}. Lab: ${reservationDetails.lab_name}, Computer: ${reservationDetails.computer_name}, Date: ${reservationDetails.reservation_date}, Time: ${reservationDetails.time_in}. Admin Notes: ${adminNotes || 'None'}`
      );
      
      // Refresh reservations list
      fetchReservations();
      
      // Clear admin notes
      setAdminNotes('');
      
      // Show success message
      alert('Reservation rejected successfully');
      
    } catch (err) {
      console.error('Error rejecting reservation:', err);
      alert(err.message || 'Failed to reject reservation');
    } finally {
      setActionInProgress(null);
    }
  };

  // Handle admin notes change
  const handleNotesChange = (e) => {
    setAdminNotes(e.target.value);
  };

  // Get the status badge style based on status
  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Reservation Approval</h1>
        
        {/* Filters Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 mb-6">
          <div className="flex flex-col md:flex-row items-start md:items-center mb-4">
            <h2 className="text-lg font-medium text-gray-700 mb-2 md:mb-0 flex items-center">
              <FiFilter className="mr-2" />
              Filters
            </h2>
            <button 
              onClick={resetFilters}
              className="ml-0 md:ml-auto flex items-center text-sm text-blue-600 hover:text-blue-800"
            >
              <FiRefreshCw className="mr-1" />
              Reset Filters
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                className="w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 p-2"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            
            {/* Lab Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lab
              </label>
              <select
                name="labId"
                value={filters.labId}
                onChange={handleFilterChange}
                className="w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 p-2"
                disabled={labsLoading}
              >
                <option value="">All Labs</option>
                {labs.map(lab => (
                  <option key={lab.lab_id} value={lab.lab_id}>
                    {lab.lab_name}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Date Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date
              </label>
              <input
                type="date"
                name="date"
                value={filters.date}
                onChange={handleFilterChange}
                className="w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 p-2"
              />
            </div>
            
            {/* Search Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by name, ID, purpose..."
                  value={filters.search}
                  onChange={handleSearchChange}
                  className="w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 p-2 pl-9"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiSearch className="text-gray-400" />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Admin Notes Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 mb-6">
          <h2 className="text-lg font-medium text-gray-700 mb-2 flex items-center">
            <FiEdit3 className="mr-2" />
            Admin Notes
          </h2>
          <p className="text-sm text-gray-600 mb-2">
            These notes will be included when approving or rejecting a reservation.
          </p>
          <textarea
            value={adminNotes}
            onChange={handleNotesChange}
            className="w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 p-2"
            placeholder="Optional notes for the student (e.g., Please bring your student ID)"
            rows="2"
          ></textarea>
        </div>
        
        {/* Reservations List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-0 mb-6 overflow-hidden">
          <h2 className="text-lg font-medium text-gray-700 p-4 border-b border-gray-100 flex items-center">
            <FiInfo className="mr-2" />
            Reservations
            {loading && <FiLoader className="ml-2 animate-spin text-blue-500" />}
          </h2>
          
          {error && (
            <div className="p-4 bg-red-50 border-b border-red-100 text-red-700">
              <div className="flex items-center">
                <FiAlertCircle className="mr-2" />
                <span>{error}</span>
              </div>
            </div>
          )}
          
          {!loading && !error && reservations.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              <p>No reservations found matching your filters.</p>
              <button 
                onClick={resetFilters}
                className="mt-2 text-sm text-blue-600 hover:text-blue-800"
              >
                Reset Filters
              </button>
            </div>
          )}
          
          {reservations.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Lab / Computer
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date & Time
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Purpose
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reservations.map((reservation) => (
                    <tr key={reservation.reservation_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                            <FiUserCheck className="text-gray-500" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {reservation.firstname} {reservation.lastname}
                            </div>
                            <div className="text-sm text-gray-500">
                              ID: {reservation.idno}
                            </div>
                            <div className="text-xs text-gray-500">
                              {reservation.course} • Year {reservation.level}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-start">
                          <FiMonitor className="flex-shrink-0 mt-1 mr-2 text-gray-500" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {reservation.computer_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {reservation.lab_name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-start">
                          <FiCalendar className="flex-shrink-0 mt-1 mr-2 text-gray-500" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {formatDate(reservation.reservation_date)}
                            </div>
                            <div className="text-sm text-gray-500 flex items-center">
                              <FiClock className="mr-1" />
                              {reservation.time_in.substring(0, 5)} ({reservation.duration} hour{reservation.duration > 1 ? 's' : ''})
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-start">
                          <FiBriefcase className="flex-shrink-0 mt-1 mr-2 text-gray-500" />
                          <div className="text-sm text-gray-900 max-w-xs break-words">
                            {reservation.purpose.length > 100 
                              ? `${reservation.purpose.substring(0, 100)}...` 
                              : reservation.purpose}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full border ${getStatusBadge(reservation.status)}`}>
                          {reservation.status.charAt(0).toUpperCase() + reservation.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {reservation.status === 'pending' ? (
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => handleApprove(reservation.reservation_id)}
                              disabled={actionInProgress === reservation.reservation_id}
                              className="bg-green-100 hover:bg-green-200 text-green-700 px-3 py-1 rounded-md flex items-center text-sm"
                            >
                              {actionInProgress === reservation.reservation_id ? (
                                <FiLoader className="animate-spin mr-1" />
                              ) : (
                                <FiCheck className="mr-1" />
                              )}
                              Approve
                            </button>
                            <button
                              onClick={() => handleReject(reservation.reservation_id)}
                              disabled={actionInProgress === reservation.reservation_id}
                              className="bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1 rounded-md flex items-center text-sm"
                            >
                              {actionInProgress === reservation.reservation_id ? (
                                <FiLoader className="animate-spin mr-1" />
                              ) : (
                                <FiX className="mr-1" />
                              )}
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-gray-500">
                            {reservation.status === 'approved' && 'Approved'}
                            {reservation.status === 'rejected' && 'Rejected'}
                            {reservation.status === 'completed' && 'Completed'}
                            {reservation.status === 'cancelled' && 'Cancelled'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminReservationRequest;