import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

function StudentDashboard() {
    const location = useLocation();
    const [userData, setUserData] = useState({
        username: 'johndoe',
        sessionsRemaining: 18, // This will come from users.sessions_remaining
        nextSession: '2023-11-15T14:00:00'
    });
    
    const [currentLab, setCurrentLab] = useState({
        name: 'Computer Networking Lab',
        location: 'Building 2, Room 205',
        supervisor: 'Dr. Smith',
        purpose: 'Network Configuration Practice',
        assignedDate: '2023-11-01',
        status: 'Active'
    });
    
    const [announcements, setAnnouncements] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        console.log('Student Dashboard loaded at:', location.pathname);
        
        // Fetch user data (including sessions remaining)
        const fetchUserData = async () => {
            try {
                // In a real app, you would fetch this from your API
                // const response = await fetch('/api/user');
                // const data = await response.json();
                // setUserData(data);
                
                // Mock data for demonstration
                setUserData({
                    username: 'johndoe',
                    sessionsRemaining: 18,
                    nextSession: '2023-11-15T14:00:00'
                });
            } catch (error) {
                console.error('Error fetching user data:', error);
            }
        };

        // Fetch current lab assignment
        const fetchLabAssignment = async () => {
            try {
                // In a real app, you would fetch this from your API
                // const response = await fetch('/api/lab-assignment');
                // const data = await response.json();
                // setCurrentLab(data);
                
                // Mock data for demonstration
                setCurrentLab({
                    name: 'Computer Networking Lab',
                    location: 'Building 2, Room 205',
                    supervisor: 'Dr. Smith',
                    purpose: 'Network Configuration Practice',
                    assignedDate: '2023-11-01',
                    status: 'Active'
                });
            } catch (error) {
                console.error('Error fetching lab assignment:', error);
            }
        };

        // Fetch announcements
        const fetchAnnouncements = async () => {
            try {
                // In a real app:
                // const response = await fetch('/api/announcements');
                // const data = await response.json();
                // setAnnouncements(data.announcements);
                
                // Mock data for demonstration
                const mockAnnouncements = [
                    { 
                        id: 1, 
                        title: 'Lab Maintenance Schedule', 
                        content: 'The Computer Networking Lab will be closed this Friday for scheduled maintenance from 1 PM to 5 PM.', 
                        created_at: '2023-11-10 09:30:00',
                        author_name: 'Lab Admin'
                    },
                    { 
                        id: 2, 
                        title: 'New Network Equipment Installed', 
                        content: 'We have installed new Cisco routers in Lab B. Please handle with care and report any issues immediately.', 
                        created_at: '2023-11-05 14:15:00',
                        author_name: 'Dr. Smith'
                    }
                ];
                setAnnouncements(mockAnnouncements);
            } catch (error) {
                console.error('Error fetching announcements:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchUserData();
        fetchLabAssignment();
        fetchAnnouncements();
    }, [location]);

    return (
        <div className="bg-gray-100 min-h-screen p-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Student Dashboard</h1>
            
            {/* Lab Information */}
            <div className="bg-white rounded-lg shadow p-6 mb-8">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Current Lab Assignment</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <h3 className="text-gray-500 text-sm font-medium">Lab Name</h3>
                        <p className="text-lg font-medium text-gray-800">{currentLab.name}</p>
                        <p className="text-sm text-gray-500 mt-1">Purpose: {currentLab.purpose}</p>
                    </div>
                    <div>
                        <h3 className="text-gray-500 text-sm font-medium">Location</h3>
                        <p className="text-lg font-medium text-gray-800">{currentLab.location}</p>
                        <p className="text-sm text-gray-500 mt-1">Status: <span className={`font-medium ${currentLab.status === 'Active' ? 'text-green-600' : 'text-yellow-600'}`}>
                            {currentLab.status}
                        </span></p>
                    </div>
                    <div>
                        <h3 className="text-gray-500 text-sm font-medium">Supervisor & Date</h3>
                        <p className="text-lg font-medium text-gray-800">{currentLab.supervisor}</p>
                        <p className="text-sm text-gray-500 mt-1">Assigned: {new Date(currentLab.assignedDate).toLocaleDateString()}</p>
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Session Tracking */}
                <div className="bg-white rounded-lg shadow p-6 lg:col-span-1">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Session Usage</h2>
                    
                    <div className="mb-6">
                        <div className="flex justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">
                                Sessions remaining
                            </span>
                            <span className="text-sm font-medium text-blue-600">
                                {userData.sessionsRemaining}
                            </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div 
                                className="bg-blue-600 h-2.5 rounded-full" 
                                style={{ width: `${(userData.sessionsRemaining / 30) * 100}%` }}
                            ></div>
                        </div>
                    </div>
                    
                    <div className="space-y-4">
                        <div className="bg-blue-50 p-4 rounded-lg">
                            <h3 className="text-gray-500 text-sm font-medium">Next Scheduled Session</h3>
                            <p className="text-lg font-medium text-gray-800 mt-1">
                                {new Date(userData.nextSession).toLocaleString()}
                            </p>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg">
                            <h3 className="text-gray-500 text-sm font-medium">Current Status</h3>
                            <p className="text-lg font-medium text-gray-800 mt-1">
                                {userData.sessionsRemaining > 5 ? 'Active' : 'Low Sessions'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Announcements */}
                <div className="bg-white rounded-lg shadow p-6 lg:col-span-2">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Announcements</h2>
                    {isLoading ? (
                        <p>Loading announcements...</p>
                    ) : (
                        <div className="space-y-4">
                            {announcements.length > 0 ? (
                                announcements.map(announcement => (
                                    <div key={announcement.id} className="border-l-4 border-blue-500 pl-4 py-2">
                                        <div className="flex justify-between items-start">
                                            <h3 className="font-medium text-gray-800">{announcement.title}</h3>
                                            <span className="text-sm text-gray-500">
                                                {new Date(announcement.created_at).toLocaleDateString()} • {announcement.author_name}
                                            </span>
                                        </div>
                                        <p className="text-gray-600 mt-1">{announcement.content}</p>
                                    </div>
                                ))
                            ) : (
                                <p className="text-gray-500">No announcements available</p>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Lab Rules and History */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Lab Rules */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Lab Rules</h2>
                    <div className="space-y-3">
                        <div className="flex items-start">
                            <div className="flex-shrink-0 h-5 w-5 text-green-500 mt-0.5">•</div>
                            <p className="ml-2 text-gray-700">Strictly no food or drinks in the lab area</p>
                        </div>
                        <div className="flex items-start">
                            <div className="flex-shrink-0 h-5 w-5 text-green-500 mt-0.5">•</div>
                            <p className="ml-2 text-gray-700">Always log out after using computers</p>
                        </div>
                        <div className="flex items-start">
                            <div className="flex-shrink-0 h-5 w-5 text-green-500 mt-0.5">•</div>
                            <p className="ml-2 text-gray-700">Report any equipment issues immediately to the lab supervisor</p>
                        </div>
                        <div className="flex items-start">
                            <div className="flex-shrink-0 h-5 w-5 text-green-500 mt-0.5">•</div>
                            <p className="ml-2 text-gray-700">Keep noise levels to a minimum to avoid disturbing others</p>
                        </div>
                    </div>
                </div>

                {/* Recent History */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Recent Lab Sessions</h2>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lab</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Purpose</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                <tr>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800">Nov 10, 2023</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800">Networking Lab</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800">Router Configuration</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-green-600 font-medium">Completed</td>
                                </tr>
                                <tr>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800">Nov 8, 2023</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800">Programming Lab</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800">Python Exercises</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-green-600 font-medium">Completed</td>
                                </tr>
                                <tr>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800">Nov 5, 2023</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800">Hardware Lab</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800">PC Assembly</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-green-600 font-medium">Completed</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default StudentDashboard;