import { useState, useEffect } from 'react';
import { useAuth } from '../../context/auth-context';
import { FiMonitor, FiCheck } from 'react-icons/fi';

function AdminComputerManagement() {
  const { user } = useAuth();
  const [labs, setLabs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedLab, setSelectedLab] = useState(null);
  const [computers, setComputers] = useState([]);

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

  const toggleComputerStatus = async (computerId) => {
    // Find the computer
    const computer = computers.find(c => c.computer_id === computerId);
    if (!computer) return;
    
    // Toggle between 'in_use' and 'available'
    const newStatus = computer.status === 'in_use' ? 'available' : 'in_use';
    
    try {
      // Only make API call for real computers
      if (!computer.isPlaceholder) {
        setIsLoading(true);
        const response = await fetch('http://localhost/sysarch_reboot/sysarch_php/computers.php', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
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
      }
      
      // Update local state
      setComputers(prevComputers => 
        prevComputers.map(c => 
          c.computer_id === computerId 
            ? { ...c, status: newStatus } 
            : c
        )
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
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
                {/* Computer Grid Layout */}
                <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-8 lg:grid-cols-10 gap-4">
                  {computers.map((computer) => (
                    <div 
                      key={computer.computer_id}
                      onClick={() => toggleComputerStatus(computer.computer_id)}
                      className={`cursor-pointer aspect-square flex flex-col items-center justify-center rounded-lg border p-2 transition-all ${
                        computer.status === 'in_use' 
                          ? 'bg-blue-100 border-blue-300 shadow-md' 
                          : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      <div className="relative">
                        <FiMonitor 
                          size={32} 
                          className={computer.status === 'in_use' ? 'text-blue-600' : 'text-gray-600'} 
                        />
                        {computer.status === 'in_use' && (
                          <div className="absolute -top-2 -right-2 bg-blue-500 rounded-full p-0.5">
                            <FiCheck size={12} className="text-white" />
                          </div>
                        )}
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
    </div>
  );
}

export default AdminComputerManagement;