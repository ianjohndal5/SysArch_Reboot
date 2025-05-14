import { useState, useEffect } from 'react';
import { useAuth } from '../../context/auth-context';
import { FiMonitor, FiCheck, FiX, FiClock } from 'react-icons/fi';

function AdminComputerManagement() {
  const { user } = useAuth();
  const [labs, setLabs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedLab, setSelectedLab] = useState(null);
  const [computers, setComputers] = useState([]);
  const [selectedComputer, setSelectedComputer] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);

  useEffect(() => {
    fetchLabs();
  }, []);

  useEffect(() => {
    if (selectedLab) {
      fetchComputers(selectedLab.lab_id);
    }
  }, [selectedLab]);

  const fetchLabs = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('http://localhost/sysarch_reboot/sysarch_php/labs.php');
      
      if (!response.ok) {
        throw new Error('Failed to fetch labs');
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to load labs');
      }
      
      setLabs(data.data);
      if (data.data.length > 0) {
        setSelectedLab(data.data[0]);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchComputers = async (labId) => {
    try {
      setIsLoading(true);
      const response = await fetch(`http://localhost/sysarch_reboot/sysarch_php/computers.php?lab_id=${labId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch computers');
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to load computers');
      }
      
      // If fewer than 50 computers were returned, generate placeholders up to 50
      let computersArray = [...data.data];
      if (computersArray.length < 50) {
        const missingCount = 50 - computersArray.length;
        const placeholderComputers = Array.from({ length: missingCount }, (_, i) => ({
          computer_id: `placeholder-${i}`,
          computer_name: `PC-${(computersArray.length + i + 1).toString().padStart(2, '0')}`,
          status: 'available',
          lab_id: labId,
          isPlaceholder: true
        }));
        
        computersArray = [...computersArray, ...placeholderComputers];
      }
      
      setComputers(computersArray);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const updateComputerStatus = async (computerId, newStatus) => {
    if (!computerId) return;
    
    try {
      setIsLoading(true);
      const response = await fetch('http://localhost/sysarch_reboot/sysarch_php/computers.php', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          computer_id: computerId,
          status: newStatus
        })
      });
      
      const data = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to update computer status');
      }
      
      // Update local state
      setComputers(prevComputers => 
        prevComputers.map(c => 
          c.computer_id === computerId 
            ? { ...c, status: newStatus } 
            : c
        )
      );
      
      setShowStatusModal(false);
      setSelectedComputer(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 border-green-300 text-green-600';
      case 'unavailable':
        return 'bg-red-100 border-red-300 text-red-600';
      case 'used':
        return 'bg-blue-100 border-blue-300 text-blue-600';
      default:
        return 'bg-gray-100 border-gray-300 text-gray-600';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'available':
        return <FiCheck className="text-green-600" />;
      case 'unavailable':
        return <FiX className="text-red-600" />;
      case 'used':
        return <FiClock className="text-blue-600" />;
      default:
        return null;
    }
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center p-6 bg-white rounded-lg shadow-md max-w-md">
          <h1 className="text-2xl font-bold mb-4 text-red-600">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  if (isLoading && !selectedLab) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Computer Management</h1>
          <select
            className="px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={selectedLab ? selectedLab.lab_id : ''}
            onChange={(e) => {
              const labId = e.target.value;
              const lab = labs.find(l => l.lab_id === parseInt(labId));
              setSelectedLab(lab);
            }}
          >
            {labs.map(lab => (
              <option key={lab.lab_id} value={lab.lab_id}>
                {lab.lab_name}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}

        {selectedLab && (
          <div className="mb-6">
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-4 bg-blue-50 border-b">
                <h2 className="text-xl font-semibold">{selectedLab.lab_name}</h2>
                <p className="text-gray-600">{selectedLab.description}</p>
              </div>
              
              <div className="p-4">
                {/* Status Legend */}
                <div className="mb-4 flex gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="text-sm">Available</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <span className="text-sm">Unavailable</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span className="text-sm">In Use</span>
                  </div>
                </div>

                {/* Computer Grid Layout */}
                <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-8 lg:grid-cols-10 gap-4">
                  {computers.map((computer) => (
                    <div 
                      key={computer.computer_id}
                      onClick={() => {
                        if (!computer.isPlaceholder) {
                          setSelectedComputer(computer);
                          setShowStatusModal(true);
                        }
                      }}
                      className={`cursor-pointer aspect-square flex flex-col items-center justify-center rounded-lg border p-2 transition-all ${
                        getStatusColor(computer.status)
                      } ${computer.isPlaceholder ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md'}`}
                    >
                      <div className="relative">
                        <FiMonitor size={32} />
                        <div className="absolute -top-2 -right-2 bg-white rounded-full p-0.5 shadow">
                          {getStatusIcon(computer.status)}
                        </div>
                      </div>
                      <span className="mt-2 text-xs font-medium text-center">
                        {computer.computer_name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Status Update Modal */}
      {showStatusModal && selectedComputer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">
              Update Status - {selectedComputer.computer_name}
            </h3>
            
            <div className="space-y-3">
              {['available', 'unavailable', 'used'].map((status) => (
                <button
                  key={status}
                  onClick={() => updateComputerStatus(selectedComputer.computer_id, status)}
                  className={`w-full py-2 px-4 rounded-md border transition-colors ${
                    selectedComputer.status === status
                      ? 'bg-blue-500 text-white'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
            
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => {
                  setShowStatusModal(false);
                  setSelectedComputer(null);
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminComputerManagement;