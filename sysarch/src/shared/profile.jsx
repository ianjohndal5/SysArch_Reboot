import { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/auth-context';
import { FiUser, FiEdit, FiSave, FiLock, FiMail, FiHome, FiClock, FiArrowLeft, FiCalendar } from 'react-icons/fi';

function Profile() {
  const { user: currentUser, updateUser } = useAuth();
  const { idno } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [editMode, setEditMode] = useState(false);
  const [profileData, setProfileData] = useState({
    idno: '',
    firstname: '',
    middlename: '',
    lastname: '',
    course: '',
    level: 1,
    email: '',
    address: '',
    username: '',
    session: 30,
    registeredat: '',
    role: 'student'
  });
  const [isLoading, setIsLoading] = useState(true);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Available courses and levels
  const courses = [
    "Computer Science",
    "Information Technology",
    "Computer Engineering",
    "Information Systems"
  ];
  const levels = [1, 2, 3, 4];

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setIsLoading(true);
        let userData;
        
        if (idno && idno !== currentUser.idno) {
          const response = await fetch(`http://localhost/fetch-profile.php?idno=${idno}`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });
          const result = await response.json();
          if (!response.ok) throw new Error(result.error || 'Failed to fetch profile');
          userData = result.user;
          setEditMode(false);
        } else {
          userData = location.state?.userData || currentUser;
        }

        setProfileData({
          idno: userData.idno || '',
          firstname: userData.firstname || '',
          middlename: userData.middlename || '',
          lastname: userData.lastname || '',
          course: userData.course || courses[0],
          level: userData.level || 1,
          email: userData.email || '',
          address: userData.address || '',
          username: userData.username || '',
          session: userData.session || 30,
          registeredat: userData.registeredat || '',
          role: userData.role || 'student'
        });
      } catch (error) {
        console.error('Error fetching profile:', error);
        alert(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [idno, currentUser, location.state]);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      const updateData = {
        idno: profileData.idno,
        firstname: profileData.firstname,
        middlename: profileData.middlename,
        lastname: profileData.lastname,
        course: profileData.course,
        level: parseInt(profileData.level),
        email: profileData.email,
        address: profileData.address,
        username: profileData.username
      };
      
      if (passwordData.newPassword && passwordData.newPassword === passwordData.confirmPassword) {
        updateData.password = passwordData.newPassword;
        updateData.currentPassword = passwordData.currentPassword;
      }
      
      const response = await fetch('http://localhost/update-profile.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(updateData)
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to update profile');
      }
      
      setEditMode(false);
      alert('Profile updated successfully!');
      
      if (updateUser) {
        updateUser({
          ...currentUser,
          ...updateData
        });
      }
      
      // Clear password fields after successful update
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      console.error('Update error:', error);
      alert(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center text-blue-600 mb-4"
      >
        <FiArrowLeft className="mr-2" /> Back
      </button>
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          {profileData.role === 'admin' ? 'Admin Profile' : 'Student Profile'}
          {idno && idno !== currentUser.idno && ` - ${profileData.firstname} ${profileData.lastname}`}
        </h1>
        {(!idno || idno === currentUser.idno) && !editMode && (
          <button
            onClick={() => setEditMode(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            <FiEdit className="mr-2" />
            Edit Profile
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column - Profile Picture and Non-editable Info */}
        <div className="md:col-span-1 flex flex-col items-center">
          <div className="w-40 h-40 rounded-full bg-gray-200 flex items-center justify-center mb-4">
            <FiUser className="text-4xl text-gray-400" />
          </div>
          
          <div className="w-full space-y-2">
            <div className="p-3 bg-gray-50 rounded-lg">
              <label className="block text-sm font-medium text-gray-500">Student ID</label>
              <p className="font-medium">{profileData.idno}</p>
            </div>
            
            <div className="p-3 bg-gray-50 rounded-lg">
              <label className="block text-sm font-medium text-gray-500">Role</label>
              <p className="font-medium capitalize">{profileData.role}</p>
            </div>
            
            <div className="p-3 bg-gray-50 rounded-lg">
              <label className="block text-sm font-medium text-gray-500">Remaining Session</label>
              <p className="font-medium flex items-center">
                <FiClock className="mr-2" /> {profileData.session} minutes
              </p>
            </div>
            
            <div className="p-3 bg-gray-50 rounded-lg">
              <label className="block text-sm font-medium text-gray-500">Registered Date</label>
              <p className="font-medium flex items-center">
                <FiCalendar className="mr-2" /> 
                {new Date(profileData.registeredat).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Right Column - Editable Profile Info */}
        <div className="md:col-span-2">
          <form onSubmit={handleSaveProfile}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {/* Personal Information */}
              <div className="space-y-4">
                <h2 className="text-lg font-semibold flex items-center">
                  <FiUser className="mr-2" /> Personal Information
                </h2>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                  {editMode ? (
                    <input
                      type="text"
                      name="firstname"
                      value={profileData.firstname}
                      onChange={handleProfileChange}
                      className="w-full p-2 border rounded"
                      required
                    />
                  ) : (
                    <p className="p-2 bg-gray-50 rounded">{profileData.firstname}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Middle Name</label>
                  {editMode ? (
                    <input
                      type="text"
                      name="middlename"
                      value={profileData.middlename}
                      onChange={handleProfileChange}
                      className="w-full p-2 border rounded"
                    />
                  ) : (
                    <p className="p-2 bg-gray-50 rounded">{profileData.middlename}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                  {editMode ? (
                    <input
                      type="text"
                      name="lastname"
                      value={profileData.lastname}
                      onChange={handleProfileChange}
                      className="w-full p-2 border rounded"
                      required
                    />
                  ) : (
                    <p className="p-2 bg-gray-50 rounded">{profileData.lastname}</p>
                  )}
                </div>
              </div>
              
              {/* Academic Information */}
              <div className="space-y-4">
                <h2 className="text-lg font-semibold flex items-center">
                  <FiHome className="mr-2" /> Academic Information
                </h2>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Course *</label>
                  {editMode ? (
                    <select
                      name="course"
                      value={profileData.course}
                      onChange={handleProfileChange}
                      className="w-full p-2 border rounded"
                      required
                    >
                      {courses.map(course => (
                        <option key={course} value={course}>{course}</option>
                      ))}
                    </select>
                  ) : (
                    <p className="p-2 bg-gray-50 rounded">{profileData.course}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Year Level *</label>
                  {editMode ? (
                    <select
                      name="level"
                      value={profileData.level}
                      onChange={handleProfileChange}
                      className="w-full p-2 border rounded"
                      required
                    >
                      {levels.map(level => (
                        <option key={level} value={level}>Year {level}</option>
                      ))}
                    </select>
                  ) : (
                    <p className="p-2 bg-gray-50 rounded">Year {profileData.level}</p>
                  )}
                </div>
              </div>
              
              {/* Contact Information */}
              <div className="space-y-4">
                <h2 className="text-lg font-semibold flex items-center">
                  <FiMail className="mr-2" /> Contact Information
                </h2>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  {editMode ? (
                    <input
                      type="email"
                      name="email"
                      value={profileData.email}
                      onChange={handleProfileChange}
                      className="w-full p-2 border rounded"
                      required
                    />
                  ) : (
                    <p className="p-2 bg-gray-50 rounded">{profileData.email}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
                  {editMode ? (
                    <input
                      type="text"
                      name="address"
                      value={profileData.address}
                      onChange={handleProfileChange}
                      className="w-full p-2 border rounded"
                      required
                    />
                  ) : (
                    <p className="p-2 bg-gray-50 rounded">{profileData.address}</p>
                  )}
                </div>
              </div>
              
              {/* Account Information */}
              <div className="space-y-4">
                <h2 className="text-lg font-semibold flex items-center">
                  <FiLock className="mr-2" /> Account Information
                </h2>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Username *</label>
                  {editMode ? (
                    <input
                      type="text"
                      name="username"
                      value={profileData.username}
                      onChange={handleProfileChange}
                      className="w-full p-2 border rounded"
                      required
                    />
                  ) : (
                    <p className="p-2 bg-gray-50 rounded">{profileData.username}</p>
                  )}
                </div>
              </div>
            </div>
            
            {/* Password Section - Only show in edit mode for own profile */}
            {editMode && (!idno || idno === currentUser.idno) && (
              <div className="pt-4 border-t">
                <h2 className="text-lg font-semibold flex items-center mb-4">
                  <FiLock className="mr-2" /> Change Password
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Current Password *</label>
                    <input
                      type="password"
                      name="currentPassword"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      className="w-full p-2 border rounded"
                      placeholder="Enter current password"
                      required={passwordData.newPassword !== ''}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                    <input
                      type="password"
                      name="newPassword"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      className="w-full p-2 border rounded"
                      placeholder="Leave blank to keep current"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      className="w-full p-2 border rounded"
                      placeholder="Confirm new password"
                      disabled={!passwordData.newPassword}
                    />
                  </div>
                </div>
              </div>
            )}
            
            {editMode && (
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setEditMode(false);
                    setPasswordData({
                      currentPassword: '',
                      newPassword: '',
                      confirmPassword: ''
                    });
                  }}
                  className="px-4 py-2 border rounded hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </>
                  ) : (
                    <>
                      <FiSave className="mr-2" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}

export default Profile;