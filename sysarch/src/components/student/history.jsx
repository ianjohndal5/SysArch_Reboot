import { useState, useEffect } from 'react';

function History() {
    // For demo purposes - in a real app, get this from your auth system
    const currentStudentId = 15330524; // Christian Yancha's ID
    
    const [historyData, setHistoryData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showFeedbackModal, setShowFeedbackModal] = useState(false);
    const [currentSession, setCurrentSession] = useState(null);
    const [rating, setRating] = useState(0);
    const [comments, setComments] = useState('');

    useEffect(() => {
        const fetchHistoryData = async () => {
            try {
                const response = await fetch(
                    `http://localhost/sysarch_reboot/sysarch_php/history.php?idno=${currentStudentId}`
                );
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                
                if (data.success) {
                    setHistoryData(data.data);
                } else {
                    throw new Error(data.error || 'Failed to fetch history');
                }
            } catch (err) {
                console.error('Fetch error:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchHistoryData();
    }, []);

    const handleFeedbackClick = (session) => {
        setCurrentSession(session);
        setShowFeedbackModal(true);
    };

    const handleSubmitFeedback = async () => {
        try {
            const response = await fetch('http://localhost/sysarch_reboot/sysarch_php/feedback.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    sessionId: currentSession.id,
                    labRoom: currentSession.labroom, // Add lab room from current session
                    rating,
                    comments
                })
            });
    
            const responseText = await response.text();
            
            // Try to parse JSON
            let result;
            try {
                result = JSON.parse(responseText);
            } catch {
                throw new Error(responseText || 'Invalid server response');
            }
    
            if (!response.ok || !result.success) {
                throw new Error(result.error || 'Feedback submission failed');
            }
    
            // Update UI
            setHistoryData(historyData.map(item => 
                item.id === currentSession.id ? { ...item, feedbackGiven: true } : item
            ));
            setShowFeedbackModal(false);
            setRating(0);
            setComments('');
            
            alert('Feedback submitted successfully!');
            
        } catch (err) {
            console.error('Feedback submission error:', err);
            alert(`Error: ${err.message}`);
        }
    };

    const formatDateTime = (datetime) => {
        if (!datetime) return 'N/A';
        try {
            const date = new Date(datetime);
            if (isNaN(date)) throw new Error('Invalid date');
            return date.toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return datetime;
        }
    };

    if (loading) {
        return <div className="text-center py-8">Loading history...</div>;
    }

    if (error) {
        return <div className="text-center py-8 text-red-500">Error: {error}</div>;
    }

    return (
        <div className="max-w-6xl mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Lab Usage History</h1>
            
            {historyData.length === 0 ? (
                <div className="bg-blue-50 p-4 rounded">No history records found.</div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="py-2 px-4 text-left">Lab</th>
                                <th className="py-2 px-4 text-left">Purpose</th>
                                <th className="py-2 px-4 text-left">Login</th>
                                <th className="py-2 px-4 text-left">Logout</th>
                                <th className="py-2 px-4 text-left">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {historyData.map((session) => (
                                <tr key={session.id} className="border-b">
                                    <td className="py-2 px-4">{session.labroom}</td>
                                    <td className="py-2 px-4">{session.purpose}</td>
                                    <td className="py-2 px-4">{formatDateTime(session.login)}</td>
                                    <td className="py-2 px-4">{formatDateTime(session.logout)}</td>
                                    <td className="py-2 px-4">
                                        {!session.feedbackGiven ? (
                                            <button
                                                onClick={() => handleFeedbackClick(session)}
                                                className="text-blue-600 hover:text-blue-800"
                                            >
                                                Feedback
                                            </button>
                                        ) : (
                                            <span className="text-gray-500">Submitted</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Feedback Modal */}
            {showFeedbackModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-medium text-gray-900">Session Feedback</h3>
                            <button
                                onClick={() => setShowFeedbackModal(false)}
                                className="text-gray-400 hover:text-gray-500"
                            >
                                <span className="sr-only">Close</span>
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        
                        <div className="mb-4">
                            <p className="text-sm text-gray-600 mb-2">
                                <span className="font-medium">Session:</span> {currentSession?.labroom} on {formatDateTime(currentSession?.login)}
                            </p>
                            <p className="text-sm text-gray-600">
                                <span className="font-medium">Purpose:</span> {currentSession?.purpose}
                            </p>
                        </div>
                        
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                            <div className="flex space-x-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        onClick={() => setRating(star)}
                                        className={`h-8 w-8 rounded-full ${rating >= star ? 'bg-yellow-400' : 'bg-gray-200'} flex items-center justify-center`}
                                    >
                                        <svg
                                            className="h-5 w-5 text-white"
                                            fill="currentColor"
                                            viewBox="0 0 20 20"
                                        >
                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                        </svg>
                                    </button>
                                ))}
                            </div>
                        </div>
                        
                        <div className="mb-6">
                            <label htmlFor="comments" className="block text-sm font-medium text-gray-700 mb-2">
                                Comments
                            </label>
                            <textarea
                                id="comments"
                                rows={3}
                                className="shadow-sm focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border border-gray-300 rounded-md p-2"
                                placeholder="Any additional feedback about your lab experience..."
                                value={comments}
                                onChange={(e) => setComments(e.target.value)}
                            />
                        </div>
                        
                        <div className="flex justify-end space-x-3">
                            <button
                                type="button"
                                onClick={() => setShowFeedbackModal(false)}
                                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleSubmitFeedback}
                                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                            >
                                Submit Feedback
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default History;