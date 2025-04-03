import { useEffect, useState } from 'react';

function Announcement() {
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchAnnouncements = async () => {
            try {
                const response = await fetch('http://localhost/sysarch_reboot/sysarch_php/announcements.php');
                if (!response.ok) {
                    throw new Error('Failed to fetch announcements');
                }
                const data = await response.json();
                if (data.success) {
                    setAnnouncements(data.announcements);
                } else {
                    throw new Error(data.error || 'Unknown error');
                }
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchAnnouncements();
    }, []);

    if (loading) {
        return (
            <div className="max-w-4xl mx-auto p-6">
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-4xl mx-auto p-6">
                <div className="bg-red-50 border-l-4 border-red-500 p-4">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-red-700">Error loading announcements: {error}</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800 mb-2">Announcements</h1>
                <p className="text-gray-600">Latest updates from the lab administration</p>
            </div>

            {announcements.length === 0 ? (
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
                    <p className="text-blue-700">No announcements available at this time.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {announcements.map(announcement => (
                        <div 
                            key={announcement.id}
                            className="border-l-4 border-blue-500 bg-blue-50 rounded-r-lg p-5 shadow-sm hover:shadow-md transition-shadow"
                        >
                            <div className="flex justify-between items-start mb-2">
                                <h2 className="text-xl font-semibold text-gray-800">{announcement.title}</h2>
                                <span className="text-sm text-gray-500">
                                    {new Date(announcement.created_at).toLocaleDateString('en-US', { 
                                        year: 'numeric', 
                                        month: 'long', 
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </span>
                            </div>
                            <p className="text-gray-700 mb-3">{announcement.content}</p>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-500">
                                    Posted by: {announcement.author_name || 'System'}
                                </span>
                                {announcement.target && announcement.target !== 'all' && (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                        For: {announcement.target}
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Archive section can be implemented later with pagination */}
            {/* <div className="mt-10 border-t pt-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Older Announcements</h2>
                ...
            </div> */}
        </div>
    );
}

export default Announcement;