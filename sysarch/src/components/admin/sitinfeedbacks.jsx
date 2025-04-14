import { useState, useEffect, useRef } from 'react';
import { 
  FiSearch, 
  FiChevronLeft,
  FiChevronRight,
  FiEye,
  FiTrash2,
  FiDownload
} from 'react-icons/fi';
import moment from 'moment';
import { CSVLink } from 'react-csv';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

function AdminSitinfeedbacks() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Refs for export checkboxes
  const csvLinkRef = useRef(null);
  const exportCheckboxRefs = {
    student_id: useRef(),
    student_name: useRef(),
    lab_room: useRef(),
    rating: useRef(),
    comments: useRef(),
    created_at: useRef()
  };

  // State for filters and UI
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [viewMode, setViewMode] = useState('list');
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState('csv');
  const [exportData, setExportData] = useState([]);
  const itemsPerPage = 10;

  // Fetch feedback data from API
  useEffect(() => {
    const fetchFeedbacks = async () => {
      try {
        const response = await fetch('http://localhost/sysarch_reboot/sysarch_php/feedback.php');
        
        if (!response.ok) {
          throw new Error('Failed to fetch feedback data');
        }

        const data = await response.json();
        
        if (data.success) {
          setFeedbacks(data.data);
        } else {
          throw new Error(data.error || 'Failed to fetch feedback');
        }
      } catch (err) {
        console.error('Fetch error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchFeedbacks();
  }, []);

  // Filter feedbacks based on search term
  const filteredFeedbacks = feedbacks.filter(feedback => {
    return (
      feedback.student_id.toString().includes(searchTerm.toLowerCase()) ||
      feedback.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (feedback.comments && feedback.comments.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  // Pagination
  const totalPages = Math.ceil(filteredFeedbacks.length / itemsPerPage);
  const paginatedFeedbacks = filteredFeedbacks.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Handle feedback actions
  const handleViewDetails = (feedback) => {
    setSelectedFeedback(feedback);
    setViewMode('details');
  };

  const handleDeleteFeedback = async (id) => {
    if (window.confirm('Are you sure you want to delete this feedback?')) {
      try {
        const response = await fetch(`http://localhost/sysarch_reboot/sysarch_php/delete_feedback.php?id=${id}`, {
          method: 'DELETE'
        });

        if (!response.ok) {
          throw new Error('Failed to delete feedback');
        }

        const result = await response.json();
        
        if (result.success) {
          setFeedbacks(feedbacks.filter(f => f.id !== id));
          if (selectedFeedback && selectedFeedback.id === id) {
            setViewMode('list');
          }
          alert('Feedback deleted successfully!');
        }
      } catch (err) {
        console.error('Delete error:', err);
        alert(`Error: ${err.message}`);
      }
    }
  };

  const handleBackToList = () => {
    setViewMode('list');
    setSelectedFeedback(null);
  };

  // Export functions
  const prepareExportData = () => {
    const selectedColumns = Object.entries(exportCheckboxRefs)
      .filter(([_, ref]) => ref.current.checked)
      .map(([key, _]) => key);

    return filteredFeedbacks.map(feedback => {
      const exportItem = {};
      selectedColumns.forEach(col => {
        if (col === 'created_at') {
          exportItem[col] = moment(feedback[col]).format('YYYY-MM-DD HH:mm:ss');
        } else {
          exportItem[col] = feedback[col];
        }
      });
      return exportItem;
    });
  };

  const handleExport = () => {
    const dataToExport = prepareExportData();
    setExportData(dataToExport);
    
    switch(exportFormat) {
      case 'csv':
        csvLinkRef.current.link.click();
        break;
      case 'excel':
        exportToExcel(dataToExport);
        break;
      case 'pdf':
        exportToPDF(dataToExport);
        break;
      default:
        break;
    }
    
    setShowExportModal(false);
  };

  const exportToExcel = (data) => {
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      
      // Header text with smaller font
      const headerText = [
        "University of Cebu-Main", 
        "College of Computer Studies", 
        "Computer Laboratory Sitin Monitoring System Report"
      ];
      
      // Insert header rows
      XLSX.utils.sheet_add_aoa(worksheet, [headerText], { origin: "A1" });
      
      // Merge header cells (A1 to last column)
      if (!worksheet["!merges"]) worksheet["!merges"] = [];
      const lastCol = XLSX.utils.encode_col(Object.keys(data[0]).length - 1);
      worksheet["!merges"].push({ s: { r: 0, c: 0 }, e: { r: 2, c: lastCol.charCodeAt(0) - 65 } });
      
      // Apply smaller font size (10pt instead of default 12pt) and center alignment
      for (let i = 0; i < 3; i++) {
        const cellAddress = XLSX.utils.encode_cell({ r: i, c: 0 });
        worksheet[cellAddress].s = {
          alignment: { horizontal: "center", vertical: "center" },
          font: { 
            bold: true,
            sz: 10 // Smaller font size (10pt)
          }
        };
      }
      
      XLSX.utils.book_append_sheet(workbook, worksheet, "Report");
      XLSX.writeFile(workbook, "sit-in-reports.xlsx");
    };
  
  
    const exportToPDF = (data) => { 
      const doc = new jsPDF();
      
      // Header text with smaller font
      const headerText = [
        "University of Cebu-Main",
        "College of Computer Studies",
        "Computer Laboratory Sitin Monitoring System Report"
      ];
      
      // Add centered title with smaller font (10pt)
      doc.setFontSize(10); // Reduced from 12
      doc.setFont("helvetica", "bold");
      
      // Adjust vertical spacing (reduced from 7 to 5)
      headerText.forEach((line, index) => {
        doc.text(line, doc.internal.pageSize.width / 2, 15 + (index * 5), { 
          align: "center" 
        });
      });
      
      // Prepare table data
      const headers = [Object.keys(data[0])];
      const rows = data.map(item => Object.values(item));
      
      // Add table with adjusted start position
      autoTable(doc, {
        head: headers,
        body: rows,
        startY: 30, // Reduced from 40 (less space after header)
        styles: { 
          fontSize: 8,
          halign: "center"
        },
        headStyles: {
          fillColor: "#2c3e50",
          textColor: "#ffffff",
          fontStyle: "bold",
          fontSize: 8 // Smaller header font
        }
      });
      
      doc.save("sit-in-reports.pdf");
    };

  if (loading) {
    return <div className="p-6 text-center">Loading feedbacks...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Student Feedback Management</h1>
      
      {viewMode === 'list' ? (
        <>
          {/* Search Filter */}
          <div className="mb-6">
            <div className="relative">
              <FiSearch className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search by ID, name or comments..."
                className="pl-10 pr-4 py-2 w-full border rounded"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
          </div>

          {/* Feedback Table */}
          <div className="bg-white rounded shadow overflow-hidden mb-4">
            <table className="min-w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left">Student ID</th>
                  <th className="px-4 py-2 text-left">Name</th>
                  <th className="px-4 py-2 text-left">Lab Room</th>
                  <th className="px-4 py-2 text-left">Rating</th>
                  <th className="px-4 py-2 text-left">Comments</th>
                  <th className="px-4 py-2 text-left">Date</th>
                  <th className="px-4 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedFeedbacks.length > 0 ? (
                  paginatedFeedbacks.map(feedback => (
                    <tr key={feedback.id} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-4">{feedback.student_id}</td>
                      <td className="px-4 py-4">{feedback.student_name}</td>
                      <td className="px-4 py-4">{feedback.lab_room}</td>
                      <td className="px-4 py-4">
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <svg
                              key={i}
                              className={`h-5 w-5 ${i < feedback.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-4">{feedback.comments}</td>
                      <td className="px-4 py-4">
                        {moment(feedback.created_at).format('MMM D, YYYY')}
                      </td>
                      <td className="px-4 py-4">
                        <button
                          onClick={() => handleViewDetails(feedback)}
                          className="text-blue-600 hover:text-blue-800 mr-2"
                          title="View Details"
                        >
                          <FiEye />
                        </button>
                        <button
                          onClick={() => handleDeleteFeedback(feedback.id)}
                          className="text-red-600 hover:text-red-800"
                          title="Delete"
                        >
                          <FiTrash2 />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-4 py-4 text-center text-gray-500">
                      No feedback records found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination and Export */}
          <div className="flex justify-between items-center">
            <div>
              <button
                onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="flex items-center px-4 py-2 border rounded disabled:opacity-50 mr-2"
              >
                <FiChevronLeft className="mr-1" /> Previous
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="flex items-center px-4 py-2 border rounded disabled:opacity-50"
              >
                Next <FiChevronRight className="ml-1" />
              </button>
            </div>
            
            <span className="text-sm text-gray-600">
              Page {currentPage} of {totalPages} | {filteredFeedbacks.length} feedback records
            </span>
            
            <button
              onClick={() => setShowExportModal(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              <FiDownload className="mr-2" /> Export
            </button>
          </div>
        </>
      ) : (
        /* Feedback Detail View */
        selectedFeedback && (
          <div className="bg-white rounded shadow p-6">
            <button
              onClick={handleBackToList}
              className="flex items-center text-blue-600 mb-4"
            >
              <FiChevronLeft className="mr-1" /> Back to list
            </button>
            
            <h2 className="text-xl font-bold mb-4">Feedback Details</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="font-semibold mb-2">Student Information</h3>
                <div className="space-y-2">
                  <p><span className="font-medium">ID:</span> {selectedFeedback.student_id}</p>
                  <p><span className="font-medium">Name:</span> {selectedFeedback.student_name}</p>
                  <p><span className="font-medium">Lab Room:</span> {selectedFeedback.lab_room}</p>
                  <p><span className="font-medium">Date Submitted:</span> {moment(selectedFeedback.created_at).format('MMMM D, YYYY')}</p>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Rating</h3>
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className={`h-6 w-6 ${i < selectedFeedback.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Comments</h3>
              <div className="bg-gray-50 p-4 rounded">
                {selectedFeedback.comments || 'No comments provided'}
              </div>
            </div>
          </div>
        )
      )}

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Export Feedback</h3>
            
            <div className="mb-4">
              <label className="block font-medium mb-2">Format:</label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    className="mr-2"
                    checked={exportFormat === 'csv'}
                    onChange={() => setExportFormat('csv')}
                  />
                  CSV
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    className="mr-2"
                    checked={exportFormat === 'excel'}
                    onChange={() => setExportFormat('excel')}
                  />
                  Excel
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    className="mr-2"
                    checked={exportFormat === 'pdf'}
                    onChange={() => setExportFormat('pdf')}
                  />
                  PDF
                </label>
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block font-medium mb-2">Columns to Export:</label>
              <div className="grid grid-cols-2 gap-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="mr-2"
                    defaultChecked
                    ref={exportCheckboxRefs.student_id}
                  />
                  Student ID
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="mr-2"
                    defaultChecked
                    ref={exportCheckboxRefs.student_name}
                  />
                  Student Name
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="mr-2"
                    defaultChecked
                    ref={exportCheckboxRefs.lab_room}
                  />
                  Lab Room
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="mr-2"
                    defaultChecked
                    ref={exportCheckboxRefs.rating}
                  />
                  Rating
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="mr-2"
                    defaultChecked
                    ref={exportCheckboxRefs.comments}
                  />
                  Comments
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="mr-2"
                    defaultChecked
                    ref={exportCheckboxRefs.created_at}
                  />
                  Date Submitted
                </label>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowExportModal(false)}
                className="px-4 py-2 border rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleExport}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Export
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden CSV Link */}
      <CSVLink
        data={exportData}
        filename="feedback-reports.csv"
        className="hidden"
        ref={csvLinkRef}
      />
    </div>
  );
}

export default AdminSitinfeedbacks;