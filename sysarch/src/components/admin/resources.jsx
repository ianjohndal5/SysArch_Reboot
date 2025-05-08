import { useState, useEffect } from 'react';
import { 
  FiSearch, 
  FiChevronLeft, 
  FiChevronRight, 
  FiDownload,
  FiEdit,
  FiTrash2,
  FiEye,
  FiEyeOff,
  FiLoader,
  FiUpload,
  FiFilter,
  FiPlus,
  FiX
} from 'react-icons/fi';
import ResourceUploadModal from './modals/resourceuploadmodal';
import ResourceEditModal from './modals/resourceeditmodal';

function Resources() {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState({});
  const [statusLoading, setStatusLoading] = useState({});
  
  // State for filtering, sorting, and pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortConfig, setSortConfig] = useState({ 
    key: 'uploaded_at', 
    direction: 'desc' 
  });
  
  // Modal state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedResource, setSelectedResource] = useState(null);
  
  const itemsPerPage = 10;

  // Fetch data from API
  useEffect(() => {
    fetchResources();
  }, []);
  
  const fetchResources = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost/sysarch_reboot/sysarch_php/resources.php');
      if (!response.ok) {
        throw new Error('Failed to fetch resources data');
      }
      const result = await response.json();
      
      if (result.success && Array.isArray(result.data)) {
        setResources(result.data);
      } else {
        throw new Error(result.error || 'Invalid data format');
      }
    } catch (err) {
      setError(err.message);
      setResources([]);
    } finally {
      setLoading(false);
    }
  };

  // Request sort
  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Sort function
  const sortedData = [...resources].sort((a, b) => {
    if (a[sortConfig.key] < b[sortConfig.key]) {
      return sortConfig.direction === 'asc' ? -1 : 1;
    }
    if (a[sortConfig.key] > b[sortConfig.key]) {
      return sortConfig.direction === 'asc' ? 1 : -1;
    }
    return 0;
  });

  // Filter resources based on search term and filters
  const filteredResources = sortedData.filter(resource => {
    const matchesSearch = 
      resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (resource.description && resource.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      `${resource.firstname} ${resource.lastname}`.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'enabled' && resource.is_enabled === 1) ||
      (statusFilter === 'disabled' && resource.is_enabled === 0);

    return matchesSearch && matchesStatus;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredResources.length / itemsPerPage);
  const currentResources = filteredResources.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Format date
  const formatDate = (datetime) => {
    if (!datetime) return 'N/A';
    const date = new Date(datetime);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  // Get file icon based on file type
  const getFileTypeIcon = (fileType) => {
    if (fileType.startsWith('image/')) {
      return '🖼️';
    } else if (fileType.includes('pdf')) {
      return '📄';
    } else if (fileType.includes('word') || fileType.includes('document')) {
      return '📝';
    } else if (fileType.includes('excel') || fileType.includes('spreadsheet')) {
      return '📊';
    } else if (fileType.includes('powerpoint') || fileType.includes('presentation')) {
      return '📑';
    } else if (fileType.includes('zip') || fileType.includes('rar') || fileType.includes('compressed')) {
      return '🗜️';
    } else {
      return '📁';
    }
  };

  // Action handlers
  const handleDownload = (resourceId) => {
    window.open(`http://localhost/sysarch_reboot/sysarch_php/download.php?id=${resourceId}`, '_blank');
  };

  const handleDelete = async (resourceId) => {
    if (!window.confirm('Are you sure you want to delete this resource?')) {
      return;
    }
    
    try {
      setDeleteLoading(prev => ({ ...prev, [resourceId]: true }));
      
      const response = await fetch('http://localhost/sysarch_reboot/sysarch_php/resources.php', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resource_id: resourceId,
          
        })
      });
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete resource');
      }
      
      // Refresh resources list
      fetchResources();
      alert('Resource deleted successfully');
      
    } catch (err) {
      console.error('Delete error:', err);
      alert(`Error: ${err.message}`);
    } finally {
      setDeleteLoading(prev => ({ ...prev, [resourceId]: false }));
    }
  };
  
  const handleToggleStatus = async (resource) => {
    try {
      setStatusLoading(prev => ({ ...prev, [resource.resource_id]: true }));
      
      const response = await fetch('http://localhost/sysarch_reboot/sysarch_php/resources.php', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resource_id: resource.resource_id,
          is_enabled: resource.is_enabled === 1 ? 0 : 1,
       
        })
      });
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to update resource status');
      }
      
      // Refresh resources list
      fetchResources();
      
    } catch (err) {
      console.error('Status toggle error:', err);
      alert(`Error: ${err.message}`);
    } finally {
      setStatusLoading(prev => ({ ...prev, [resource.resource_id]: false }));
    }
  };
  
  const handleEditResource = (resource) => {
    setSelectedResource(resource);
    setShowEditModal(true);
  };
  
  const handleResourceUpdated = () => {
    setShowEditModal(false);
    setSelectedResource(null);
    fetchResources();
  };
  
  const handleResourceUploaded = () => {
    setShowUploadModal(false);
    fetchResources();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <FiLoader className="animate-spin text-2xl text-blue-600" />
        <span className="ml-2">Loading resources data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-full text-red-600">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="bg-gray-50 p-6 h-full">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Resources & Materials</h1>
      
      {/* Action Bar */}
      <div className="mb-6 flex flex-col md:flex-row justify-between">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 md:mb-0">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search resources..."
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
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
            >
              <option value="all">All Resources</option>
              <option value="enabled">Enabled Only</option>
              <option value="disabled">Disabled Only</option>
            </select>
          </div>
        </div>
          <button
            onClick={() => setShowUploadModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md flex items-center justify-center md:justify-start"
          >
            <FiPlus className="mr-2" />
            Upload New Resource
          </button>
      </div>
      
      {/* Info Bar */}
      <div className="mb-4 text-xs text-gray-600">
        Showing {currentResources.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}-
        {Math.min(currentPage * itemsPerPage, filteredResources.length)} of {filteredResources.length} resources
      </div>

      {/* Resources Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th 
                className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => requestSort('title')}
              >
                <div className="flex items-center">
                  Resource
                  {sortConfig.key === 'title' && (
                    sortConfig.direction === 'asc' ? <FiChevronLeft className="ml-1" /> : <FiChevronRight className="ml-1" />
                  )}
                </div>
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
              <th 
                className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => requestSort('uploaded_at')}
              >
                <div className="flex items-center">
                  Uploaded
                  {sortConfig.key === 'uploaded_at' && (
                    sortConfig.direction === 'asc' ? <FiChevronLeft className="ml-1" /> : <FiChevronRight className="ml-1" />
                  )}
                </div>
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentResources.length > 0 ? (
              currentResources.map((resource) => {
                return (
                    <tr key={resource.resource_id} className="hover:bg-gray-50">
                    <td className="px-3 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <div className="text-sm font-medium text-gray-900">{resource.title}</div>
                        {resource.description && (
                          <div className="text-xs text-gray-500">{resource.description}</div>
                        )}
                        <div className="text-xs text-gray-400">
                          By: {resource.firstname} {resource.lastname}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-xl mr-2">{getFileTypeIcon(resource.file_type)}</span>
                        <span className="text-xs text-gray-500">{resource.file_type.split('/')[1]}</span>
                      </div>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-xs text-gray-500">
                      {formatFileSize(resource.file_size)}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-xs text-gray-500">
                      {formatDate(resource.uploaded_at)}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        resource.is_enabled === 1 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {resource.is_enabled === 1 ? 'Enabled' : 'Disabled'}
                      </span>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-xs text-gray-500">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleDownload(resource.resource_id)}
                          className="p-1 text-blue-600 hover:text-blue-800"
                          title="Download Resource"
                        >
                          <FiDownload />
                        </button>
                        
                        
                          <>
                            <button
                              onClick={() => handleEditResource(resource)}
                              className="p-1 text-yellow-600 hover:text-yellow-800"
                              title="Edit Resource"
                            >
                              <FiEdit />
                            </button>
                            
                            <button
                              onClick={() => handleToggleStatus(resource)}
                              disabled={statusLoading[resource.resource_id]}
                              className="p-1 text-purple-600 hover:text-purple-800"
                              title={resource.is_enabled === 1 ? "Disable Resource" : "Enable Resource"}
                            >
                              {statusLoading[resource.resource_id] ? (
                                <FiLoader className="animate-spin" />
                              ) : resource.is_enabled === 1 ? (
                                <FiEyeOff />
                              ) : (
                                <FiEye />
                              )}
                            </button>
                            
                            <button
                              onClick={() => handleDelete(resource.resource_id)}
                              disabled={deleteLoading[resource.resource_id]}
                              className="p-1 text-red-600 hover:text-red-800"
                              title="Delete Resource"
                            >
                              {deleteLoading[resource.resource_id] ? (
                                <FiLoader className="animate-spin" />
                              ) : (
                                <FiTrash2 />
                              )}
                            </button>
                          </>
                        
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="6" className="px-3 py-4 text-center text-xs text-gray-500">
                  {resources.length === 0 ? 'No resources found' : 'No resources match your search criteria'}
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
      
      {/* Upload Modal */}
      {showUploadModal && (
        <ResourceUploadModal 
          onClose={() => setShowUploadModal(false)}
          onSuccess={handleResourceUploaded}
        
        />
      )}
      
      {/* Edit Modal */}
      {showEditModal && selectedResource && (
        <ResourceEditModal
          resource={selectedResource}
          onClose={() => {
            setShowEditModal(false);
            setSelectedResource(null);
          }}
          onSuccess={handleResourceUpdated}
          
        />
      )}
    </div>
  );
}

export default Resources;