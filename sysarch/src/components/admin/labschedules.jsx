import { useState, useEffect } from 'react';
import { useAuth } from '../../context/auth-context';
import { FiEdit, FiTrash2, FiPlus, FiSave, FiX, FiClock, FiCalendar } from 'react-icons/fi';

function AdminLabManagement() {
  const { user } = useAuth();
  const [labs, setLabs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingLab, setEditingLab] = useState(null);
  const [isAddingLab, setIsAddingLab] = useState(false);
  const [expandedLab, setExpandedLab] = useState(null);
  const [activeTab, setActiveTab] = useState('details');

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  useEffect(() => {
    fetchLabs();
  }, []);

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
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveLab = async (labData) => {
    try {
      setIsLoading(true);
      
      const schedulesToSave = {};
      daysOfWeek.forEach(day => {
        if (labData.schedules[day] && labData.schedules[day].length > 0) {
          schedulesToSave[day] = labData.schedules[day];
        }
      });
      
      const response = await fetch('http://localhost/sysarch_reboot/sysarch_php/labs.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          ...labData,
          schedules: schedulesToSave
        })
      });
      
      const data = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to save lab');
      }
      
      await fetchLabs();
      setEditingLab(null);
      setIsAddingLab(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleAvailability = async (labId, day, slotIndex) => {
    try {
      setIsLoading(true);
      
      // Find the lab we're updating
      const labToUpdate = labs.find(lab => lab.lab_id === labId);
      if (!labToUpdate) return;
      
      // Make a copy of the schedules
      const updatedSchedules = {...labToUpdate.schedules};
      
      // Toggle the availability of the specific slot
      updatedSchedules[day][slotIndex].is_available = !updatedSchedules[day][slotIndex].is_available;
      
      // Prepare the data to send to the server
      const updateData = {
        lab_id: labId,
        schedules: updatedSchedules
      };
      
      // Send the update to the server
      const response = await fetch('http://localhost/sysarch_reboot/sysarch_php/labs.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(updateData)
      });
      
      const data = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to update availability');
      }
      
      // Refresh the labs data
      await fetchLabs();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleLabExpand = (labId) => {
    setExpandedLab(expandedLab === labId ? null : labId);
  };

  const getLabStatus = (lab) => {
    if (!lab.is_active) return 'Inactive';
    
    const availableSlots = Object.values(lab.schedules || {}).reduce(
      (total, daySlots) => total + daySlots.filter(slot => slot.is_available).length, 0
    );
    
    return availableSlots > 0 ? `Active (${availableSlots} slots)` : 'No Availability';
  };

  const addTimeSlot = (day) => {
    setEditingLab(prev => ({
      ...prev,
      schedules: {
        ...prev.schedules,
        [day]: [
          ...(prev.schedules[day] || []),
          { start_time: '08:00:00', end_time: '09:00:00', is_available: true }
        ]
      }
    }));
  };

  const removeTimeSlot = (day, index) => {
    setEditingLab(prev => {
      const newSlots = [...prev.schedules[day]];
      newSlots.splice(index, 1);
      
      return {
        ...prev,
        schedules: {
          ...prev.schedules,
          [day]: newSlots.length ? newSlots : undefined
        }
      };
    });
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading labs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mx-auto max-w-5xl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Lab Management</h1>
          <button
            onClick={() => {
              setIsAddingLab(true);
              setEditingLab({
                lab_name: '',
                description: '',
                capacity: 20,
                is_active: true,
                schedules: {}
              });
              setActiveTab('details');
            }}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            <FiPlus className="mr-2" /> Add New Lab
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}

        {/* Lab List */}
        <div className="space-y-4">
          {labs.map((lab) => (
            <div key={lab.lab_id} className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-4 flex justify-between items-center cursor-pointer hover:bg-gray-50" onClick={() => toggleLabExpand(lab.lab_id)}>
                <div>
                  <h3 className="font-bold text-lg">{lab.lab_name}</h3>
                  <p className="text-sm text-gray-600">{lab.description}</p>
                </div>
                <div className="flex items-center space-x-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    lab.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {getLabStatus(lab)}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingLab({
                        ...lab,
                        schedules: lab.schedules || {}
                      });
                      setActiveTab('details');
                    }}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    <FiEdit />
                  </button>
                </div>
              </div>

              {expandedLab === lab.lab_id && (
                <div className="border-t p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <h4 className="font-semibold text-gray-700">Capacity</h4>
                      <p>{lab.capacity} seats</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-700">Status</h4>
                      <p>{lab.is_active ? 'Active' : 'Inactive'}</p>
                    </div>
                  </div>

                  <h4 className="font-semibold text-gray-700 mb-2">Availability Schedule</h4>
                  
                  {Object.keys(lab.schedules || {}).length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            {daysOfWeek.map(day => (
                              <th key={day} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                {day}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          <tr>
                            {daysOfWeek.map(day => (
                              <td key={day} className="px-4 py-2 whitespace-nowrap">
                                {lab.schedules[day] ? (
                                  <div className="space-y-1">
                                    {lab.schedules[day].map((slot, idx) => (
                                      <div 
                                        key={idx} 
                                        className={`p-2 rounded text-sm cursor-pointer transition-colors ${
                                          slot.is_available 
                                            ? 'bg-green-100 hover:bg-green-200 text-green-800' 
                                            : 'bg-red-100 hover:bg-red-200 text-red-800'
                                        }`}
                                        onClick={() => handleToggleAvailability(lab.lab_id, day, idx)}
                                      >
                                        <div className="font-medium">
                                          {slot.start_time.substring(0, 5)} - {slot.end_time.substring(0, 5)}
                                        </div>
                                        <div className="text-xs">
                                          {slot.is_available ? 'Available' : 'Unavailable'}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="text-gray-400 italic text-sm">No slots</div>
                                )}
                              </td>
                            ))}
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-gray-500 italic">No availability scheduled</div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Edit/Add Lab Modal */}
      {(editingLab || isAddingLab) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl flex flex-col" style={{ maxHeight: '90vh' }}>
            {/* Sticky Header */}
            <div className="flex justify-between items-center border-b p-4 sticky top-0 bg-white z-10">
              <h3 className="text-lg font-bold">
                {isAddingLab ? 'Add New Lab' : 'Edit Lab'}
              </h3>
              <button 
                onClick={() => {
                  setEditingLab(null);
                  setIsAddingLab(false);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <FiX size={20} />
              </button>
            </div>
            
            {/* Sticky Tab Navigation */}
            <div className="border-b sticky top-14 bg-white z-10">
              <div className="flex">
                <button
                  className={`py-3 px-6 ${activeTab === 'details' 
                    ? 'border-b-2 border-blue-500 text-blue-600 font-medium' 
                    : 'text-gray-500 hover:text-gray-700'}`}
                  onClick={() => setActiveTab('details')}
                >
                  Lab Details
                </button>
                <button
                  className={`py-3 px-6 ${activeTab === 'schedule' 
                    ? 'border-b-2 border-blue-500 text-blue-600 font-medium' 
                    : 'text-gray-500 hover:text-gray-700'}`}
                  onClick={() => setActiveTab('schedule')}
                >
                  Schedule Configuration
                </button>
              </div>
            </div>
            
            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto">
              {/* Lab Details Tab */}
              {activeTab === 'details' && (
                <div className="space-y-6 p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Lab Name *
                      </label>
                      <input
                        type="text"
                        className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={editingLab.lab_name}
                        onChange={(e) => setEditingLab({
                          ...editingLab,
                          lab_name: e.target.value
                        })}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Capacity *
                      </label>
                      <input
                        type="number"
                        className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={editingLab.capacity}
                        onChange={(e) => setEditingLab({
                          ...editingLab,
                          capacity: parseInt(e.target.value) || 0
                        })}
                        min="1"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows="3"
                      value={editingLab.description}
                      onChange={(e) => setEditingLab({
                        ...editingLab,
                        description: e.target.value
                      })}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={editingLab.is_active ? 'true' : 'false'}
                      onChange={(e) => setEditingLab({
                        ...editingLab,
                        is_active: e.target.value === 'true'
                      })}
                    >
                      <option value="true">Active</option>
                      <option value="false">Inactive</option>
                    </select>
                  </div>
                </div>
              )}
              
              {/* Schedule Configuration Tab */}
              {activeTab === 'schedule' && (
                <div className="p-6">
                  <div className="sticky top-0 bg-white pb-4 z-10">
                    <h4 className="text-lg font-semibold mb-2">Schedule Configuration</h4>
                    <p className="text-sm text-gray-600">
                      Add multiple time slots for each day as needed
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4">
                    {daysOfWeek.map(day => (
                      <div key={day} className="border rounded flex flex-col" style={{ maxHeight: '50vh' }}>
                        <div className="p-3 border-b sticky top-0 bg-white z-10">
                          <div className="flex justify-between items-center">
                            <h5 className="font-medium">{day}</h5>
                            <button 
                              onClick={() => addTimeSlot(day)}
                              className="p-1 text-blue-600 hover:text-blue-800"
                            >
                              <FiPlus size={16} />
                            </button>
                          </div>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-2 space-y-2">
                          {(editingLab.schedules[day] || []).map((slot, idx) => (
                            <div key={idx} className="border rounded p-2 bg-gray-50">
                              <div className="flex justify-between items-center mb-2">
                                <label className="flex items-center">
                                  <input
                                    type="checkbox"
                                    className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                                    checked={slot.is_available}
                                    onChange={(e) => {
                                      const newSlots = [...editingLab.schedules[day]];
                                      newSlots[idx].is_available = e.target.checked;
                                      setEditingLab({
                                        ...editingLab,
                                        schedules: {
                                          ...editingLab.schedules,
                                          [day]: newSlots
                                        }
                                      });
                                    }}
                                  />
                                  <span className="ml-2 text-sm">Available</span>
                                </label>
                                <button
                                  onClick={() => removeTimeSlot(day, idx)}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <FiTrash2 size={14} />
                                </button>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="block text-xs text-gray-500 mb-1">Start</label>
                                  <input
                                    type="time"
                                    className="w-full p-1 border rounded text-sm"
                                    value={slot.start_time}
                                    onChange={(e) => {
                                      const newSlots = [...editingLab.schedules[day]];
                                      newSlots[idx].start_time = e.target.value;
                                      setEditingLab({
                                        ...editingLab,
                                        schedules: {
                                          ...editingLab.schedules,
                                          [day]: newSlots
                                        }
                                      });
                                    }}
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs text-gray-500 mb-1">End</label>
                                  <input
                                    type="time"
                                    className="w-full p-1 border rounded text-sm"
                                    value={slot.end_time}
                                    onChange={(e) => {
                                      const newSlots = [...editingLab.schedules[day]];
                                      newSlots[idx].end_time = e.target.value;
                                      setEditingLab({
                                        ...editingLab,
                                        schedules: {
                                          ...editingLab.schedules,
                                          [day]: newSlots
                                        }
                                      });
                                    }}
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                          
                          {(!editingLab.schedules[day] || editingLab.schedules[day].length === 0) && (
                            <button
                              onClick={() => addTimeSlot(day)}
                              className="w-full text-center text-sm text-blue-600 hover:text-blue-800 p-2 border border-dashed border-blue-300 rounded"
                            >
                              <FiPlus className="inline mr-1" /> Add slot
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sticky Footer */}
            <div className="border-t p-4 sticky bottom-0 bg-white z-10">
              <div className="flex justify-between">
                <button
                  onClick={() => {
                    setEditingLab(null);
                    setIsAddingLab(false);
                  }}
                  className="px-4 py-2 border rounded hover:bg-gray-100"
                >
                  Cancel
                </button>
                
                <div className="space-x-3">
                  {activeTab === 'details' && (
                    <button
                      onClick={() => setActiveTab('schedule')}
                      className="px-4 py-2 border rounded bg-gray-50 hover:bg-gray-100"
                    >
                      Next: Schedule
                    </button>
                  )}
                  {activeTab === 'schedule' && (
                    <button
                      onClick={() => setActiveTab('details')}
                      className="px-4 py-2 border rounded hover:bg-gray-100"
                    >
                      Back to Details
                    </button>
                  )}
                  <button
                    onClick={() => handleSaveLab(editingLab)}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center"
                    disabled={isLoading}
                  >
                    <FiSave className="mr-2" />
                    {isLoading ? 'Saving...' : 'Save Lab'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminLabManagement;