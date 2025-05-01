import { useState, useEffect } from 'react';
import { 
  FiSearch, 
  FiChevronLeft, 
  FiChevronRight, 
  FiLoader,
  FiFilter,
  FiArrowUp,
  FiArrowDown,
  FiTrendingUp,
  FiAward
} from 'react-icons/fi';
import { useAuth } from '../../context/auth-context'; // Import your auth context
import { useNavigate } from 'react-router-dom'; // For potential redirects

function AdminLeaderboard() {
  const { user } = useAuth(); // Get user data from auth context
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin'; // Determine if user is admin

  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State for filtering, sorting, and pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [courseFilter, setCourseFilter] = useState('all');
  const [levelFilter, setLevelFilter] = useState('all');
  const [sortConfig, setSortConfig] = useState({ 
    key: 'points', 
    direction: 'desc' 
  });

  const itemsPerPage = 10;

  // Check authentication on component mount
  useEffect(() => {
    if (!user) {
      navigate('/login'); // Redirect if not authenticated
      return;
    }
    
    // Log for debugging
    console.log('Leaderboard mounted for user:', user);
  }, [user, navigate]);

  // Fetch data from API
  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        console.log('Fetching leaderboard data...');
        const response = await fetch('http://localhost/sysarch_reboot/sysarch_php/leaderboard.php');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('API response:', result);
        
        if (result.success && Array.isArray(result.data)) {
          setLeaderboardData(result.data);
        } else {
          throw new Error(result.error || 'Invalid data format from server');
        }
      } catch (err) {
        console.error('Fetch error:', err);
        setError(err.message);
        setLeaderboardData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  // Request sort
  const requestSort = (key) => {
    let direction = 'desc';
    if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    }
    setSortConfig({ key, direction });
  };

  // Sort function
  const sortedData = [...leaderboardData].sort((a, b) => {
    if (a[sortConfig.key] < b[sortConfig.key]) {
      return sortConfig.direction === 'asc' ? -1 : 1;
    }
    if (a[sortConfig.key] > b[sortConfig.key]) {
      return sortConfig.direction === 'asc' ? 1 : -1;
    }
    return 0;
  });

  // Filter students based on search term and filters
  const filteredStudents = sortedData.filter(student => {
    const matchesSearch = 
      student.idno.toString().includes(searchTerm) ||
      (student.firstname + ' ' + student.lastname).toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCourse = courseFilter === 'all' || student.course === courseFilter;
    const matchesLevel = levelFilter === 'all' || student.level.toString() === levelFilter;

    return matchesSearch && matchesCourse && matchesLevel;
  });

  // Get unique courses and levels for filters
  const courses = [...new Set(leaderboardData.map(student => student.course))];
  const levels = [...new Set(leaderboardData.map(student => student.level.toString()))];

  // Pagination logic
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const currentStudents = filteredStudents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Get top 3 students for the podium
  const topThreeStudents = [...leaderboardData]
    .sort((a, b) => b.points - a.points)
    .slice(0, 3);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <FiLoader className="animate-spin text-2xl text-blue-600" />
        <span className="ml-2">Loading leaderboard data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-full text-red-600">
        Error: {error}
        <button 
          onClick={() => window.location.reload()} 
          className="ml-2 px-3 py-1 bg-red-100 rounded-md"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 p-6 h-full">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        {isAdmin ? 'Student Leaderboard' : 'Leaderboard'}
      </h1>
      
      {/* Podium Section */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
          <FiAward className="mr-2 text-yellow-500" />
          Top Performers
        </h2>
        
        <div className="flex flex-col md:flex-row justify-center items-end space-y-4 md:space-y-0 md:space-x-8 bg-white p-6 rounded-lg shadow-sm">
          {topThreeStudents.length > 1 && (
            <div className="flex flex-col items-center order-2 md:order-1">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden border-2 border-blue-300">
                <span className="text-xl font-bold">{topThreeStudents[1]?.firstname?.charAt(0)}{topThreeStudents[1]?.lastname?.charAt(0)}</span>
              </div>
              <div className="mt-2 text-center">
                <p className="font-medium text-sm">{topThreeStudents[1]?.firstname} {topThreeStudents[1]?.lastname}</p>
                <p className="text-xs text-gray-500">{topThreeStudents[1]?.course}</p>
                <div className="flex items-center justify-center mt-1">
                  <FiTrendingUp className="text-blue-500 mr-1" />
                  <span className="font-bold text-blue-500">{topThreeStudents[1]?.points} pts</span>
                </div>
              </div>
              <div className="w-20 h-24 bg-blue-200 rounded-t-lg mt-2 flex items-center justify-center">
                <span className="text-xl font-bold text-gray-700">2nd</span>
              </div>
            </div>
          )}
          
          {topThreeStudents.length > 0 && (
            <div className="flex flex-col items-center order-1 md:order-2">
              <div className="w-20 h-20 rounded-full bg-yellow-100 flex items-center justify-center overflow-hidden border-2 border-yellow-400">
                <span className="text-2xl font-bold">{topThreeStudents[0]?.firstname?.charAt(0)}{topThreeStudents[0]?.lastname?.charAt(0)}</span>
              </div>
              <div className="mt-2 text-center">
                <p className="font-medium">{topThreeStudents[0]?.firstname} {topThreeStudents[0]?.lastname}</p>
                <p className="text-xs text-gray-500">{topThreeStudents[0]?.course}</p>
                <div className="flex items-center justify-center mt-1">
                  <FiTrendingUp className="text-yellow-500 mr-1" />
                  <span className="font-bold text-yellow-500">{topThreeStudents[0]?.points} pts</span>
                </div>
              </div>
              <div className="w-24 h-32 bg-yellow-200 rounded-t-lg mt-2 flex items-center justify-center">
                <span className="text-2xl font-bold text-yellow-700">1st</span>
              </div>
            </div>
          )}
          
          {topThreeStudents.length > 2 && (
            <div className="flex flex-col items-center order-3">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border-2 border-orange-300">
                <span className="text-xl font-bold">{topThreeStudents[2]?.firstname?.charAt(0)}{topThreeStudents[2]?.lastname?.charAt(0)}</span>
              </div>
              <div className="mt-2 text-center">
                <p className="font-medium text-sm">{topThreeStudents[2]?.firstname} {topThreeStudents[2]?.lastname}</p>
                <p className="text-xs text-gray-500">{topThreeStudents[2]?.course}</p>
                <div className="flex items-center justify-center mt-1">
                  <FiTrendingUp className="text-orange-500 mr-1" />
                  <span className="font-bold text-orange-500">{topThreeStudents[2]?.points} pts</span>
                </div>
              </div>
              <div className="w-16 h-20 bg-gray-200 rounded-t-lg mt-2 flex items-center justify-center">
                <span className="text-xl font-bold text-orange-700">3rd</span>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Filters and Search */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative">
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
        
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FiFilter className="text-gray-400" />
          </div>
          <select
            value={courseFilter}
            onChange={(e) => setCourseFilter(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
          >
            <option value="all">All Courses</option>
            {courses.map(course => (
              <option key={course} value={course}>{course}</option>
            ))}
          </select>
        </div>
        
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FiFilter className="text-gray-400" />
          </div>
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
          >
            <option value="all">All Levels</option>
            {levels.map(level => (
              <option key={level} value={level}>Level {level}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Info Bar */}
      <div className="mb-4 text-xs text-gray-600">
        Showing {currentStudents.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}-
        {Math.min(currentPage * itemsPerPage, filteredStudents.length)} of {filteredStudents.length} students
      </div>

      {/* Leaderboard Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rank
              </th>
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
                onClick={() => requestSort('firstname')}
              >
                <div className="flex items-center">
                  Name
                  {sortConfig.key === 'firstname' && (
                    sortConfig.direction === 'asc' ? <FiArrowUp className="ml-1" /> : <FiArrowDown className="ml-1" />
                  )}
                </div>
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Course
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Level
              </th>
              <th 
                className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => requestSort('points')}
              >
                <div className="flex items-center">
                  Points
                  {sortConfig.key === 'points' && (
                    sortConfig.direction === 'asc' ? <FiArrowUp className="ml-1" /> : <FiArrowDown className="ml-1" />
                  )}
                </div>
              </th>
              <th 
                className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => requestSort('session')}
              >
                <div className="flex items-center">
                  Session Count
                  {sortConfig.key === 'session' && (
                    sortConfig.direction === 'asc' ? <FiArrowUp className="ml-1" /> : <FiArrowDown className="ml-1" />
                  )}
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentStudents.length > 0 ? (
              currentStudents.map((student, index) => {
                const rank = (currentPage - 1) * itemsPerPage + index + 1;
                const rankClass = rank === 1 ? 'text-yellow-500' : 
                                  rank === 2 ? 'text-gray-500' : 
                                  rank === 3 ? 'text-orange-500' : 'text-gray-700';
                
                return (
                  <tr key={student.idno} className="hover:bg-gray-50">
                    <td className="px-3 py-4 whitespace-nowrap">
                      <span className={`font-bold ${rankClass}`}>#{rank}</span>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-xs font-medium text-gray-900">
                      {student.idno}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-xs text-gray-500">
                      {student.firstname} {student.lastname}
                    </td>
                    <td className="px-3 py-4 text-xs text-gray-500">
                      {student.course}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-xs text-gray-500">
                      Level {student.level}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-xs font-medium">
                      <div className="flex items-center">
                        <FiTrendingUp className={`mr-1 ${student.points > 0 ? 'text-blue-500' : 'text-gray-400'}`} />
                        <span className={`${student.points > 0 ? 'text-blue-600' : 'text-gray-500'}`}>
                          {student.points} pts
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-xs text-gray-500">
                      {student.session}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="7" className="px-3 py-4 text-center text-xs text-gray-500">
                  {leaderboardData.length === 0 ? 'No student data found' : 'No students match your search criteria'}
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

export default AdminLeaderboard;