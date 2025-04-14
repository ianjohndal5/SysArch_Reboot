import { useState, useEffect } from 'react';
import { 
  FiSearch, 
  FiChevronLeft, 
  FiChevronRight,
  FiEdit2,
  FiTrash2,
  FiRefreshCw,
  FiSave,
  FiX
} from 'react-icons/fi';

function Studentlist() {
  const [studentsData, setStudentsData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetSessionValue, setResetSessionValue] = useState(30);
  const itemsPerPage = 10;

  // Fetch students from API
  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('http://localhost/sysarch_reboot/sysarch_php/students.php');
      
      // First check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        throw new Error(`Server returned invalid format: ${text.substring(0, 100)}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch students');
      }
      
      setStudentsData(data.students);
    } catch (err) {
      setError(err.message);
      console.error('Fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter students based on search term
  const filteredStudents = studentsData.filter(student => {
    const searchLower = searchTerm.toLowerCase();
    return (
      student.idno.toString().toLowerCase().includes(searchLower) ||
      student.lastname.toLowerCase().includes(searchLower) ||
      student.firstname.toLowerCase().includes(searchLower) ||
      student.course.toLowerCase().includes(searchLower) ||
      student.email.toLowerCase().includes(searchLower) ||
      student.username.toLowerCase().includes(searchLower)
    );
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const currentStudents = filteredStudents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Edit functions
  const handleEditClick = (student) => {
    setEditingId(student.idno);
    setEditFormData({
      firstname: student.firstname,
      lastname: student.lastname,
      middlename: student.middlename,
      course: student.course,
      session: student.session,
      level: student.level,
      email: student.email,
      username: student.username,
      address: student.address
    });
  };

  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditFormData({
      ...editFormData,
      [name]: value
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  const handleSaveEdit = async (idno) => {
    try {
      setIsLoading(true);
      const response = await fetch('http://localhost/sysarch_reboot/sysarch_php/update_student.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          idno,
          ...editFormData,
          level: parseInt(editFormData.level),
          session: parseInt(editFormData.session)
        })
      });
  
      const text = await response.text(); // First get the raw text
      let result;
      try {
        result = JSON.parse(text); // Then try to parse it
      } catch (e) {
        console.error('Failed to parse JSON:', text);
        throw new Error('Invalid server response');
      }
  
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to update student');
      }
  
      // Update local state
      setStudentsData(studentsData.map(student => 
        student.idno === idno ? { ...student, ...editFormData } : student
      ));
      
      setEditingId(null);
    } catch (err) {
      setError(err.message);
      console.error('Update error:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Delete function
  const handleDeleteStudent = async (idno) => {
    if (window.confirm('Are you sure you want to delete this student?')) {
      try {
        setIsLoading(true);
        const response = await fetch('http://localhost/sysarch_reboot/sysarch_php/delete_student.php', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ idno })
        });
  
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to delete student');
        }
  
        const result = await response.json();
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to delete student');
        }
  
        // Update local state
        setStudentsData(studentsData.filter(student => student.idno !== idno));
      } catch (err) {
        setError(err.message);
        console.error('Delete error:', err);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Session reset functions
  const handleResetAllSessions = async () => {
    if (window.confirm(`Are you sure you want to reset all sessions to ${resetSessionValue}?`)) {
      try {
        setIsLoading(true);
        const response = await fetch('http://localhost/sysarch_reboot/sysarch_php/reset_sessions.php', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ session_value: resetSessionValue })
        });

        const result = await response.json();
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to reset sessions');
        }

        // Refresh student data
        await fetchStudents();
        setShowResetModal(false);
        alert('All sessions have been reset successfully!');
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="bg-gray-50 p-6 h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading students...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-50 p-6 h-full flex items-center justify-center">
        <div className="text-center text-red-500">
          <p>Error loading students: {error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 p-6 h-full">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Student List</h1>
      
      {/* Search and Filter */}
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full sm:w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FiSearch className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search students..."
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
        
        <div className="flex items-center gap-2">
          <div className="text-sm text-gray-600">
            Showing {currentStudents.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}-
            {Math.min(currentPage * itemsPerPage, filteredStudents.length)} of {filteredStudents.length} students
          </div>
          <button
            onClick={() => setShowResetModal(true)}
            className="flex items-center px-3 py-2 bg-yellow-500 text-white rounded-md text-sm hover:bg-yellow-600"
            title="Reset All Sessions"
          >
            <FiRefreshCw className="mr-1" /> Reset Sessions
          </button>
        </div>
      </div>

      {/* Student Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID No</th>
              <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
              <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year</th>
              <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
              <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sessions</th>
              <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
              <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentStudents.length > 0 ? (
              currentStudents.map((student) => (
                <tr key={student.idno} className="hover:bg-gray-50">
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{student.idno}</td>
                  
                  {/* Editable Name */}
                  {editingId === student.idno ? (
                    <>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex flex-col space-y-2">
                          <input
                            type="text"
                            name="lastname"
                            value={editFormData.lastname}
                            onChange={handleEditFormChange}
                            className="text-sm border rounded px-2 py-1 w-full"
                            placeholder="Lastname"
                          />
                          <input
                            type="text"
                            name="firstname"
                            value={editFormData.firstname}
                            onChange={handleEditFormChange}
                            className="text-sm border rounded px-2 py-1 w-full"
                            placeholder="Firstname"
                          />
                          <input
                            type="text"
                            name="middlename"
                            value={editFormData.middlename}
                            onChange={handleEditFormChange}
                            className="text-sm border rounded px-2 py-1 w-full"
                            placeholder="Middlename"
                          />
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <input
                          type="text"
                          name="course"
                          value={editFormData.course}
                          onChange={handleEditFormChange}
                          className="text-sm border rounded px-2 py-1 w-full"
                        />
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <input
                          type="text"
                          name="level"
                          value={editFormData.level}
                          onChange={handleEditFormChange}
                          className="text-sm border rounded px-2 py-1 w-full"
                        />
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <input
                          type="text"
                          name="email"
                          value={editFormData.email}
                          onChange={handleEditFormChange}
                          className="text-sm border rounded px-2 py-1 w-full"
                        />
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <input
                          type="text"
                          name="username"
                          value={editFormData.username}
                          onChange={handleEditFormChange}
                          className="text-sm border rounded px-2 py-1 w-full"
                        />
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        <input
                          type="number"
                          name="session"
                          value={editFormData.session}
                          onChange={handleEditFormChange}
                          className="text-sm border rounded px-2 py-1 w-full"
                        />
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <input
                          type="text"
                          name="address"
                          value={editFormData.address}
                          onChange={handleEditFormChange}
                          className="text-sm border rounded px-2 py-1 w-full"
                        />
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleSaveEdit(student.idno)}
                            className="text-green-600 hover:text-green-800"
                            title="Save"
                          >
                            <FiSave />
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="text-red-600 hover:text-red-800"
                            title="Cancel"
                          >
                            <FiX />
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {student.lastname}, {student.firstname} {student.middlename}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{student.course}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{student.level}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{student.email}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{student.username}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{student.session}</td>
                      <td className="px-4 py-4 text-sm text-gray-500 max-w-xs truncate">{student.address}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEditClick(student)}
                            className="text-blue-600 hover:text-blue-800"
                            title="Edit"
                          >
                            <FiEdit2 />
                          </button>
                          <button
                            onClick={() => handleDeleteStudent(student.idno)}
                            className="text-red-600 hover:text-red-800"
                            title="Delete"
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="9" className="px-4 py-4 text-center text-sm text-gray-500">
                  {studentsData.length === 0 ? 'No students found' : 'No students match your search'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <button
            onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className="flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiChevronLeft className="mr-1" />
            Previous
          </button>
          
          <div className="hidden sm:flex space-x-1">
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
                  className={`px-4 py-2 border text-sm font-medium rounded-md ${
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
            className="flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
            <FiChevronRight className="ml-1" />
          </button>
        </div>
      )}

      {/* Reset Sessions Modal */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Reset All Sessions</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Set session count for all students:
              </label>
              <input
                type="number"
                min="0"
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                value={resetSessionValue}
                onChange={(e) => setResetSessionValue(parseInt(e.target.value) || 0)}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowResetModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleResetAllSessions}
                className="px-4 py-2 bg-yellow-500 text-white rounded-md text-sm font-medium hover:bg-yellow-600"
              >
                Reset Sessions
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Studentlist;