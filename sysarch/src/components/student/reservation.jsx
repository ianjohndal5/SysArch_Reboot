import { useState, useEffect } from 'react';
import { 
  FiCalendar, 
  FiClock, 
  FiMonitor, 
  FiUser, 
  FiAlertCircle, 
  FiLoader, 
  FiCheckCircle,
  FiXCircle,
  FiShield
} from 'react-icons/fi';

import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

function ComputerReservation() {
  // Get authentication context
  const user = '';
  const isAuthenticated = true;
  const isStudent = true;
  const navigate = useNavigate();
  
  // State for form data
  const [formData, setFormData] = useState({
    idno: '',
    purpose: '',
    lab_id: '',
    computer_id: '',
    date: '',
    time_in: '',
    duration: '1' // Default 1 hour
  });

  // State for user info (fetched after ID input)
  const [userInfo, setUserInfo] = useState(null);
  const [userLoading, setUserLoading] = useState(false);
  const [userError, setUserError] = useState(null);

  // State for available labs
  const [labs, setLabs] = useState([]);
  const [labsLoading, setLabsLoading] = useState(true);

  // State for available computers in selected lab
  const [computers, setComputers] = useState([]);
  const [computersLoading, setComputersLoading] = useState(false);

  // State for form submission status
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // State for admin approval status message
  const [approvalMessage, setApprovalMessage] = useState(null);

  // Add debug state to track form validity
  const [formIsValid, setFormIsValid] = useState(false);

  // Check authentication and redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      Swal.fire({
        title: 'Authentication Required',
        text: 'Please login to access this page',
        icon: 'warning',
        confirmButtonColor: '#3085d6',
      }).then(() => {
        navigate('/');
      });
    } else if (!isStudent) {
      Swal.fire({
        title: 'Access Denied',
        text: 'Only students can make reservations',
        icon: 'error',
        confirmButtonColor: '#d33',
      }).then(() => {
        navigate('/admin');
      });
    }
  }, [isAuthenticated, isStudent, navigate]);

  // Set user ID from authenticated user on component mount
  useEffect(() => {
    if (user && user.idno) {
      setFormData(prev => ({
        ...prev,
        idno: user.idno
      }));
    }
  }, [user]);

  // Fetch labs on component mount
  useEffect(() => {
    fetchLabs();
  }, []);

  // Fetch computers when lab is selected
  useEffect(() => {
    if (formData.lab_id) {
      fetchComputers(formData.lab_id);
    } else {
      setComputers([]);
    }
  }, [formData.lab_id]);

  // Fetch user info when component mounts if user is authenticated
  useEffect(() => {
    if (user && user.idno) {
      fetchUserInfo(user.idno);
    }
  }, [user]);

  // Check form validity whenever form data or user info changes
  useEffect(() => {
    // Log current state for debugging
    console.log({
      userInfo,
      formData,
      allFieldsFilled: Boolean(
        formData.idno && 
        formData.purpose &&
        formData.lab_id &&
        formData.computer_id &&
        formData.date &&
        formData.time_in &&
        formData.duration
      )
    });
    
    const isValid = Boolean(
      userInfo && // User info must be fetched
      userInfo.session > 0 && // User must have available sessions
      formData.idno && 
      formData.purpose &&
      formData.lab_id &&
      formData.computer_id &&
      formData.date &&
      formData.time_in &&
      formData.duration
    );
    
    setFormIsValid(isValid);
  }, [formData, userInfo]);

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

  // Fetch computers for a specific lab
  const fetchComputers = async (labId) => {
    try {
      setComputersLoading(true);
      const response = await fetch(`http://localhost/sysarch_reboot/sysarch_php/computers.php?lab_id=${labId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch computers');
      }
      
      const result = await response.json();
      
      if (result.success && Array.isArray(result.data)) {
        setComputers(result.data);
      } else {
        throw new Error(result.error || 'Invalid computers data format');
      }
    } catch (err) {
      console.error('Error fetching computers:', err);
      setComputers([]);
    } finally {
      setComputersLoading(false);
    }
  };

  // Updated fetchUserInfo function to use the new user_info.php endpoint
  const fetchUserInfo = async (idNumber = formData.idno) => {
    // Fix for the TypeError by ensuring idNumber is a string before calling trim()
    if (!idNumber || (typeof idNumber === 'string' ? idNumber.trim() === '' : true)) {
      setUserInfo(null);
      return;
    }
    
    try {
      setUserLoading(true);
      setUserError(null);
      
      // Log the request for debugging
      console.log(`Fetching user info for ID: ${idNumber}`);
      
      // Use the new endpoint
      const response = await fetch(`http://localhost/sysarch_reboot/sysarch_php/user_info.php?idno=${idNumber}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch user information');
      }
      
      const result = await response.json();
      console.log('User info result:', result); // Log the response
      
      if (result.success && result.data) {
        setUserInfo(result.data);
      } else {
        throw new Error(result.error || 'Invalid user data format');
      }
    } catch (err) {
      console.error('Error fetching user info:', err);
      setUserError(err.message || 'Failed to fetch user information');
      setUserInfo(null);
    } finally {
      setUserLoading(false);
    }
  };

  // Handle ID number input with debounce
  useEffect(() => {
    const handler = setTimeout(() => {
      if (formData.idno && formData.idno !== user?.idno) {
        fetchUserInfo();
      }
    }, 500); // 500ms debounce
    
    return () => {
      clearTimeout(handler);
    };
  }, [formData.idno, user?.idno]);

  // Handle form field changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate all required fields are filled
    if (
      !formData.idno || 
      !formData.purpose ||
      !formData.lab_id ||
      !formData.computer_id ||
      !formData.date ||
      !formData.time_in ||
      !formData.duration
    ) {
      setSubmitError('Please fill all required fields');
      return;
    }
    
    // Validate user has available sessions
    if (!userInfo) {
      setSubmitError('User information is not available');
      return;
    }
    
    if (userInfo.session <= 0) {
      setSubmitError('You have no available sessions left');
      return;
    }
    
    try {
      setSubmitting(true);
      setSubmitError(null);
      
      const response = await fetch('http://localhost/sysarch_reboot/sysarch_php/reservations.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          idno: formData.idno,
          purpose: formData.purpose,
          lab_id: formData.lab_id,
          computer_id: formData.computer_id,
          date: formData.date,
          time_in: formData.time_in,
          duration: formData.duration,
          status: 'pending' // Initial status is pending
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to submit reservation');
      }
      
      const result = await response.json();
      
      if (result.success) {
        setSubmitSuccess(true);
        setApprovalMessage("Your reservation has been submitted and is pending approval. You'll be notified once it's approved or rejected.");
        
        // Show success alert
        Swal.fire({
          title: 'Success!',
          text: 'Your reservation has been submitted successfully!',
          icon: 'success',
          confirmButtonColor: '#3085d6'
        });
        
        // Reset form except for the ID number (keep current user's ID)
        setFormData({
          idno: user?.idno || '',
          purpose: '',
          lab_id: '',
          computer_id: '',
          date: '',
          time_in: '',
          duration: '1'
        });
        
        // Refresh user info to get updated session count
        if (user && user.idno) {
          fetchUserInfo(user.idno);
        }
      } else {
        throw new Error(result.error || 'Failed to submit reservation');
      }
    } catch (err) {
      console.error('Error submitting reservation:', err);
      setSubmitError(err.message || 'Failed to submit reservation');
      setSubmitSuccess(false);
      
      // Show error alert
      Swal.fire({
        title: 'Error',
        text: err.message || 'Failed to submit reservation',
        icon: 'error',
        confirmButtonColor: '#d33'
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Set minimum date as today
  const today = new Date().toISOString().split('T')[0];

  // If not authenticated, show loading or return null
  if (!isAuthenticated || !isStudent) {
    return null;
  }

  return (
    <div className="bg-gray-50 p-6 h-full">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Computer Reservation</h1>
      
      {/* Debug info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mb-4 p-3 border border-gray-300 rounded-md bg-gray-100">
          <h3 className="font-bold">Debug Info:</h3>
          <div className="text-xs">
            <p>User Info: {userInfo ? 'Available' : 'Not Available'}</p>
            <p>Sessions: {userInfo?.session}</p>
            <p>Form Valid: {formIsValid ? 'Yes' : 'No'}</p>
            <p>All Fields Filled: {
              Boolean(
                formData.idno && 
                formData.purpose &&
                formData.lab_id &&
                formData.computer_id &&
                formData.date &&
                formData.time_in &&
                formData.duration
              ) ? 'Yes' : 'No'
            }</p>
          </div>
        </div>
      )}
      
      {/* User info banner */}
      {userInfo && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md flex items-center">
          <FiUser className="mr-3 text-blue-600 text-xl" />
          <div>
            <p className="font-medium text-blue-800">
              {userInfo.firstname} {userInfo.lastname}
            </p>
            <p className="text-sm text-blue-700">
              {userInfo.course} • Year {userInfo.level} • 
              <span className="font-medium ml-1">
                Available Sessions: <span className="font-bold">{userInfo.session}</span>
              </span>
            </p>
          </div>
        </div>
      )}
      
      {/* If user info is loading or has error */}
      {!userInfo && (
        <div className={`mb-6 p-4 rounded-md flex items-center ${
          userLoading ? "bg-yellow-50 border border-yellow-200" : 
          userError ? "bg-red-50 border border-red-200" : 
          "bg-gray-50 border border-gray-200"
        }`}>
          {userLoading ? (
            <>
              <FiLoader className="animate-spin mr-3 text-yellow-600 text-xl" />
              <p className="text-yellow-800">Loading user information...</p>
            </>
          ) : userError ? (
            <>
              <FiAlertCircle className="mr-3 text-red-600 text-xl" />
              <p className="text-red-800">{userError}</p>
            </>
          ) : (
            <>
              <FiAlertCircle className="mr-3 text-gray-600 text-xl" />
              <p className="text-gray-800">No user information available</p>
            </>
          )}
        </div>
      )}
      
      {/* Success Message */}
      {submitSuccess && (
        <div className="mb-6 p-4 bg-green-100 border border-green-300 rounded-md text-green-800 flex items-center">
          <FiCheckCircle className="mr-2 text-green-600" />
          <div>
            <p className="font-medium">Reservation Submitted Successfully!</p>
            <p className="text-sm mt-1">{approvalMessage}</p>
          </div>
        </div>
      )}
      
      {/* Error Message */}
      {submitError && (
        <div className="mb-6 p-4 bg-red-100 border border-red-300 rounded-md text-red-800 flex items-center">
          <FiXCircle className="mr-2 text-red-600" />
          <div>
            <p className="font-medium">Error</p>
            <p className="text-sm mt-1">{submitError}</p>
          </div>
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Student ID Section - Read-only when logged in */}
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Student ID Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiUser className="text-gray-400" />
                </div>
                <input
                  type="text"
                  name="idno"
                  value={formData.idno}
                  onChange={handleInputChange}
                  className={`pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${user?.idno ? 'bg-gray-100' : ''}`}
                  placeholder="Enter your ID number"
                  readOnly={!!user?.idno} // Make read-only if user is logged in
                  disabled={!!user?.idno}  // Disable if user is logged in
                />
                {user?.idno && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <FiShield className="text-green-500" title="Authenticated" />
                  </div>
                )}
              </div>
              
              {/* Student Info Loading State */}
              <div className="mt-3">
                {userLoading && (
                  <div className="flex items-center text-gray-500 text-sm">
                    <FiLoader className="animate-spin mr-2" />
                    Looking up student information...
                  </div>
                )}
                
                {userError && (
                  <div className="flex items-center text-red-500 text-sm">
                    <FiAlertCircle className="mr-2" />
                    {userError}
                  </div>
                )}
              </div>
            </div>
            
            {/* Purpose Section */}
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Purpose of Reservation
              </label>
              <textarea
                name="purpose"
                value={formData.purpose}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 p-2"
                placeholder="Please describe the purpose of your reservation"
                rows="4"
              ></textarea>
            </div>
            
            {/* Lab Selection */}
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lab Room
              </label>
              <div className="relative">
                <select
                  name="lab_id"
                  value={formData.lab_id}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 p-2"
                  disabled={labsLoading}
                >
                  <option value="">Select a Lab</option>
                  {labs.map(lab => (
                    <option key={lab.lab_id} value={lab.lab_id}>
                      {lab.lab_name}
                    </option>
                  ))}
                </select>
                {labsLoading && (
                  <div className="absolute right-2 top-2">
                    <FiLoader className="animate-spin text-gray-400" />
                  </div>
                )}
              </div>
            </div>
            
            {/* Computer Selection */}
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Computer
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiMonitor className="text-gray-400" />
                </div>
                <select
                  name="computer_id"
                  value={formData.computer_id}
                  onChange={handleInputChange}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={!formData.lab_id || computersLoading}
                >
                  <option value="">Select a Computer</option>
                  {computers
                    .filter(computer => computer.status === 'available')
                    .map(computer => (
                      <option key={computer.computer_id} value={computer.computer_id}>
                        {computer.computer_name}
                      </option>
                    ))}
                </select>
                {computersLoading && (
                  <div className="absolute right-2 top-2">
                    <FiLoader className="animate-spin text-gray-400" />
                  </div>
                )}
              </div>
              {formData.lab_id && computers.length > 0 && computers.filter(c => c.status === 'available').length === 0 && (
                <p className="text-red-500 text-xs mt-1">No available computers in this lab</p>
              )}
            </div>
            
            {/* Date Selection */}
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiCalendar className="text-gray-400" />
                </div>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  min={today}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            {/* Time Selection */}
            <div className="grid grid-cols-2 gap-4 col-span-1">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Time In
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiClock className="text-gray-400" />
                  </div>
                  <input
                    type="time"
                    name="time_in"
                    value={formData.time_in}
                    onChange={handleInputChange}
                    className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duration (hours)
                </label>
                <select
                  name="duration"
                  value={formData.duration}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 p-2"
                >
                  <option value="1">1 hour</option>
                  <option value="2">2 hours</option>
                  <option value="3">3 hours</option>
                  <option value="4">4 hours</option>
                </select>
              </div>
            </div>
          </div>
          
          {/* Submit Button */}
          <div className="mt-8 flex justify-end">
            <button
              type="submit"
              disabled={submitting || !formIsValid}
              className={`px-6 py-2 rounded-md font-medium text-white ${
                submitting || !formIsValid
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {submitting ? (
                <span className="flex items-center">
                  <FiLoader className="animate-spin mr-2" />
                  Submitting...
                </span>
              ) : (
                'Submit Reservation'
              )}
            </button>
          </div>
          
          {userInfo && userInfo.session <= 0 && (
            <p className="text-red-500 text-sm mt-2 text-right">
              You have no available sessions left. Please contact an administrator.
            </p>
          )}
          
          {!userInfo && !userLoading && (
            <p className="text-red-500 text-sm mt-2 text-right">
              User information not available. Please refresh the page or contact support.
            </p>
          )}
        </form>
      </div>
    </div>
  );
}

export default ComputerReservation;