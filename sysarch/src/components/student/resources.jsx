import { useState, useEffect } from 'react';
import { 
  FiSearch, 
  FiChevronLeft, 
  FiChevronRight, 
  FiDownload,
  FiLoader,
  FiEye,
  FiX
} from 'react-icons/fi';

function ResourcesStudent() {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State for filtering and pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ 
    key: 'uploaded_at', 
    direction: 'desc' 
  });
  
  // Preview modal state
  const [previewResource, setPreviewResource] = useState(null);
  
  const itemsPerPage = 10;

  // Fetch data from API (only enabled resources)
  useEffect(() => {
    fetchResources();
  }, []);
  
  const fetchResources = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost/sysarch_reboot/sysarch_php/resources.php?enabled=1');
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

  // Filter resources based on search term
  const filteredResources = sortedData.filter(resource => {
    return (
      resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (resource.description && resource.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      `${resource.firstname} ${resource.lastname}`.toLowerCase().includes(searchTerm.toLowerCase())
    );
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

  // Check if file is previewable
  const isPreviewable = (fileType) => {
    return fileType.startsWith('image/') || 
           fileType.includes('pdf') ||
           fileType.includes('text/');
  };

  // Action handlers
  const handleDownload = (resourceId) => {
    window.open(`http://localhost/sysarch_reboot/sysarch_php/download.php?id=${resourceId}`, '_blank');
  };
  
  const handlePreview = (resource) => {
    setPreviewResource(resource);
  };
  
  const closePreview = () => {
    setPreviewResource(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <FiLoader className="animate-spin text-2xl text-blue-600" />
        <span className="ml-2">Loading resources...</span>
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
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Learning Resources</h1>
      
      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FiSearch className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search resources..."
            className="pl-10 pr-4 py-2 w-full md:w-1/2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
      </div>
      
      {/* Info Bar */}
      <div className="mb-4 text-xs text-gray-600">
        Showing {currentResources.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}-
        {Math.min(currentPage * itemsPerPage, filteredResources.length)} of {filteredResources.length} resources
      </div>

      {/* Resources Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {currentResources.length > 0 ? (
          currentResources.map((resource) => (
            <div 
              key={resource.resource_id} 
              className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center mb-3">
                <span className="text-2xl mr-3">{getFileTypeIcon(resource.file_type)}</span>
                <div>
                  <h3 className="font-medium text-gray-900">{resource.title}</h3>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(resource.file_size)} • {resource.file_type.split('/')[1]}
                  </p>
                </div>
              </div>
              
              {resource.description && (
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{resource.description}</p>
              )}
              
              <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-100">
                <div className="text-xs text-gray-500">
                  Uploaded {formatDate(resource.uploaded_at)}
                </div>
                <div className="flex space-x-2">
                  {isPreviewable(resource.file_type) && (
                    <button
                      onClick={() => handlePreview(resource)}
                      className="flex items-center text-xs text-blue-600 hover:text-blue-800"
                    >
                      <FiEye className="mr-1" />
                      Preview
                    </button>
                  )}
                  <button
                    onClick={() => handleDownload(resource.resource_id)}
                    className="flex items-center text-xs text-blue-600 hover:text-blue-800"
                  >
                    <FiDownload className="mr-1" />
                    Download
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center p-6 bg-white rounded-lg shadow-sm border border-gray-100">
            {resources.length === 0 ? 'No resources available' : 'No resources match your search criteria'}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
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
      
      {/* Preview Modal */}
      {previewResource && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center border-b p-4">
              <h3 className="font-medium text-lg">{previewResource.title}</h3>
              <button 
                onClick={closePreview}
                className="text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-auto p-4 min-h-[50vh]">
              {previewResource.file_type.startsWith('image/') ? (
                <img 
                  src={`http://localhost/sysarch_reboot/sysarch_php/uploads/${previewResource.file_path.split('/').pop()}`} 
                  alt={previewResource.title}
                  className="max-w-full h-auto mx-auto"
                />
              ) : previewResource.file_type.includes('pdf') ? (
                <iframe
                  src={`http://localhost/sysarch_reboot/sysarch_php/uploads/${previewResource.file_path.split('/').pop()}`}
                  title={previewResource.title}
                  className="w-full h-full min-h-[70vh]"
                  frameBorder="0"
                ></iframe>
              ) : previewResource.file_type.includes('text/') ? (
                <div className="bg-gray-50 p-4 rounded overflow-auto font-mono text-sm">
                  <iframe
                    src={`http://localhost/sysarch_reboot/sysarch_php/uploads/${previewResource.file_path.split('/').pop()}`}
                    title={previewResource.title}
                    className="w-full h-full min-h-[70vh]"
                    frameBorder="0"
                  ></iframe>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <p className="mb-4">Preview not available for this file type</p>
                  <button
                    onClick={() => handleDownload(previewResource.resource_id)}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    <FiDownload className="mr-2" />
                    Download instead
                  </button>
                </div>
              )}
            </div>
            
            <div className="border-t p-4 flex justify-between items-center bg-gray-50">
              <div className="text-sm text-gray-600">
                {formatFileSize(previewResource.file_size)} • 
                {previewResource.file_type.split('/')[1]} • 
                Uploaded {formatDate(previewResource.uploaded_at)}
              </div>
              <button
                onClick={() => handleDownload(previewResource.resource_id)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <FiDownload className="mr-2" />
                Download
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ResourcesStudent;