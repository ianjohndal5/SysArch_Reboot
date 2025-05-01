import { useState, useEffect } from 'react';
import { useAuth } from '../context/auth-context';
import { FiLogOut, FiSearch, FiUser, FiX } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { FiUsers} from 'react-icons/fi';
function Navbar({ isSidebarCollapsed }) {
  const { logout, user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [purpose, setPurpose] = useState('');
  const [lab, setLab] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [availableLabs, setAvailableLabs] = useState([]);

  const leftSectionMarginLeft = isSidebarCollapsed ? '80px' : '250px';
  const userLogo = user?.role === 'student' ? 'S' : 'A';
  const userLabel = user?.role === 'student' ? 'Student' : 'Admin';

  const handleEditProfile = () => {
    const basePath = user?.role === 'admin' ? '/admin' : '/student';
    navigate(`${basePath}/profile`);
  };
  
  useEffect(() => {
    const fetchLabs = async () => {
      try {
        const response = await fetch('http://localhost/sysarch_reboot/sysarch_php/labs.php');
        const data = await response.json();
        if (data.success) {
          setAvailableLabs(data.data.map(lab => lab.lab_name));
        }
      } catch (error) {
        console.error('Failed to fetch labs:', error);
      }
    };
    
    fetchLabs();
  }, []);

  const availablePurpose = [
    'C# Programming',
    'C Programming',
    'Java Programming',
    'Asp.Net Programming',
    'Php Programming',
    'Web Design'
  ];

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setError('Please enter a student ID');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch(`http://localhost/sysarch_reboot/sysarch_php/search-student.php?idno=${encodeURIComponent(searchTerm)}`, {
        headers: {
          'Accept': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Student not found');
      }
      
      setSearchResults(data.student);
      setShowModal(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
      setSearchTerm('');
    }
  };
  
  const handleSitIn = async () => {
    if (!purpose || !lab) {
      setError('Please fill in both purpose and lab fields');
      return;
    }
  
    setIsLoading(true);
    setError('');
  
    try {
      const response = await fetch('http://localhost/sysarch_reboot/sysarch_php/sit-in.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          idno: searchResults.idno,
          name: searchResults.name,
          purpose,
          labroom: lab
        })
      });
  
      const data = await response.json();
      
      // Handle non-OK responses first
      if (!response.ok) {
        // Check for specific error types from backend
        if (data.error && data.error.includes('already sitting')) {
          throw new Error('STUDENT_ALREADY_SITTING');
        } else if (data.error && data.error.includes('No remaining sessions')) {
          throw new Error('NO_REMAINING_SESSIONS');
        } else {
          throw new Error(data.error || 'Failed to record sit-in');
        }
      }
  
      // Handle success case
      if (data.success) {
        alert(`Sit-in recorded successfully for ${searchResults.name}`);
        setShowModal(false);
        setPurpose('');
        setLab('');
      } else {
        throw new Error(data.error || 'Failed to record sit-in');
      }
    } catch (err) {
      // Handle different error types with specific messages
      switch (err.message) {
        case 'STUDENT_ALREADY_SITTING':
          setError('This student is already sitting in another lab');
          break;
        case 'NO_REMAINING_SESSIONS':
          setError('Student has no remaining sessions available');
          break;
        default:
          setError(err.message || 'An unexpected error occurred');
      }
      
      // For debugging purposes
      console.error('Sit-in error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  

  return (
    <>
      <nav className="fixed top-0 bg-white shadow-sm z-30 h-16 border-b border-gray-100 w-full">
        <div className="flex items-center justify-between h-full px-4 sm:px-6">
          {/* Left section - Adjust margin dynamically */}
          <div 
            style={{
              marginLeft: leftSectionMarginLeft,
              transition: 'margin-left 0.3s ease-in-out',
            }}
            className="flex items-center space-x-4"
          >
            <div className="flex items-center">
              {/* Dynamic logo */}
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-blue-400 rounded-md flex items-center justify-center mr-2">
                <span className="text-white font-bold text-sm">{userLogo}</span>
              </div>
              {/* Dynamic label */}
              <span className="font-bold text-lg text-gray-800 hidden sm:inline-block">{userLabel}</span>
            </div>
          </div>

          {/* Right section - Search and user profile */}
          <div className="flex items-center space-x-4">
            {/* Search bar - only show for admin */}
            {user?.role === 'admin' && (
              <div className="relative hidden md:block">
              <div className="flex items-center">
                {/* Icon placed before input */}
                <FiUsers className="absolute left-3 text-gray-500" /> {/* Positioning inside input */}
                <input
                  type="text"
                  placeholder="Search student by ID..."
                  className="pl-10 pr-4 py-1 w-64 border rounded-l focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
                <button
                  onClick={handleSearch}
                  className="bg-blue-600 text-white px-4 py-2 rounded-r hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <FiSearch />
                </button>
              </div>
            </div>
            )}

            {user && (
              <div className="flex items-center space-x-3">
                <div className="hidden md:flex flex-col items-end">
                  <span className="text-sm font-medium text-gray-700">
                    {user.name || user.email}
                  </span>
                  <span className="text-xs text-gray-500 capitalize">
                    {user.role}
                  </span>
                </div>
                
                <div className="relative group">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-r from-blue-500 to-blue-300 flex items-center justify-center text-white font-medium cursor-pointer">
                    {user.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
                  </div>
                  
                  {/* Dropdown menu */}
                  <div className="absolute right-0 mt-2 w-48 bg-blue-200 rounded-md shadow-lg py-1 z-50 invisible opacity-0 group-hover:visible group-hover:opacity-100 transitions-all duration-200">
                    <button 
                      onClick={handleEditProfile}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-blue-100 w-full text-left"
                    >
                      <FiUser className="mr-2" />
                      Edit Profile
                    </button>
                    <button
                      onClick={logout}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-blue-100 w-full text-left"
                    >
                      <FiLogOut className="mr-2" />
                      Sign out
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Student Sit-In Modal */}
      {showModal && searchResults && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center border-b p-4">
              <h3 className="text-lg font-bold">Student Sit-In</h3>
              <button 
                onClick={() => {
                  setShowModal(false);
                  setPurpose('');
                  setLab('');
                  setError('');
                }}
                className="text-gray-500 hover:text-gray-700"
                disabled={isLoading}
              >
                <FiX size={20} />
              </button>
            </div>
            
            <div className="p-6">
              {error && (
                <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">
                  {error}
                </div>
              )}
              
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-2xl font-bold">
                  {searchResults.name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-lg">{searchResults.name}</h4>
                  <p className="text-gray-600">ID: {searchResults.idno}</p>
                  <p className="text-gray-600">{searchResults.course} - Year {searchResults.level}</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Purpose *</label>
                  <select
                    type="text"
                    placeholder="e.g. Java Programming, Research, Thesis"
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    disabled={isLoading}
                  >
                    <option value="">Select a Purpose</option>
                    {availablePurpose.map((purposeOption) => (
                      <option key={purposeOption} value={purposeOption}>
                        {purposeOption}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lab Room *</label>
                  <select
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={lab}
                    onChange={(e) => setLab(e.target.value)}
                    disabled={isLoading}
                  >
                    <option value="">Select a lab</option>
                    {availableLabs.map((labOption) => (
                      <option key={labOption} value={labOption}>
                        {labOption}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 p-4 border-t">
              <button
                onClick={() => {
                  setShowModal(false);
                  setPurpose('');
                  setLab('');
                  setError('');
                }}
                className="px-4 py-2 border rounded hover:bg-gray-100"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleSitIn}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 flex items-center"
                disabled={!purpose || !lab || isLoading}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : 'Confirm Sit-In'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Navbar;