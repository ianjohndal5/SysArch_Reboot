import { useState, useEffect, useRef } from 'react';
import { 
  FiSearch, 
  FiFilter,
  FiCalendar,
  FiDownload,
  FiChevronLeft,
  FiChevronRight
} from 'react-icons/fi';
import { CSVLink } from 'react-csv';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

function SitinReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Refs for export checkboxes
  const csvLinkRef = useRef(null);
  const exportCheckboxRefs = {
    idno: useRef(),
    name: useRef(),
    purpose: useRef(),
    labroom: useRef(),
    login_time: useRef(),
    logout_time: useRef(),
    day: useRef(),
    duration: useRef(),
    status: useRef()
  };

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [purposeFilter, setPurposeFilter] = useState('all');
  const [labFilter, setLabFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Export state
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState('csv');
  const [exportData, setExportData] = useState([]);

  // Fetch data from API
  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);
        let url = 'http://localhost/sysarch_reboot/sysarch_php/sitins_history.php';
        
        if (dateFilter !== 'all') {
          url += `?date=${dateFilter}`;
        }

        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch reports');
        
        const result = await response.json();
        
        if (result.success) {
          setReports(result.data.map(report => ({
            ...report,
            duration: calculateDuration(report.login_time, report.logout_time),
            status: report.logout_time ? 'Logged Out' : 'Active'
          })));
        } else {
          throw new Error(result.error || 'Invalid data format');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [dateFilter]);

  // Get unique values for filters
  const uniquePurposes = [...new Set(reports.map(r => r.purpose))];
  const uniqueLabs = [...new Set(reports.map(r => r.labroom))];
  const uniqueDates = [...new Set(reports.map(r => r.day))].sort((a, b) => 
    new Date(b) - new Date(a)
  );

  // Calculate duration in minutes
  const calculateDuration = (login, logout) => {
    if (!login || !logout) return 0;
    const diff = new Date(logout) - new Date(login);
    return Math.round(diff / 60000);
  };

  // Format time
  const formatTime = (datetime) => {
    if (!datetime) return 'N/A';
    const date = new Date(datetime);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Filter reports
  const filteredReports = reports.filter(report => {
    const matchesSearch = 
      report.idno.toString().includes(searchTerm) ||
      report.name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesPurpose = purposeFilter === 'all' || report.purpose === purposeFilter;
    const matchesLab = labFilter === 'all' || report.labroom === labFilter;
    const matchesDate = dateFilter === 'all' || report.day === dateFilter;

    return matchesSearch && matchesPurpose && matchesLab && matchesDate;
  });

  // Pagination
  const totalPages = Math.ceil(filteredReports.length / itemsPerPage);
  const paginatedReports = filteredReports.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Export functions
  const prepareExportData = () => {
    const selectedColumns = Object.entries(exportCheckboxRefs)
      .filter(([_, ref]) => ref.current.checked)
      .map(([key, _]) => key);

    return filteredReports.map(report => {
      const exportItem = {};
      selectedColumns.forEach(col => {
        if (col === 'login_time' || col === 'logout_time') {
          exportItem[col] = formatTime(report[col]);
        } else if (col === 'day') {
          exportItem[col] = new Date(report[col]).toLocaleDateString();
        } else {
          exportItem[col] = report[col];
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
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
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
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Sit-In Reports</h1>
      
      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="md:col-span-2">
          <div className="relative">
            <FiSearch className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search by ID or name..."
              className="pl-10 pr-4 py-2 w-full border rounded"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>
        
        <div className="relative">
          <FiFilter className="absolute left-3 top-3 text-gray-400" />
          <select
            className="pl-10 pr-4 py-2 w-full border rounded"
            value={purposeFilter}
            onChange={(e) => setPurposeFilter(e.target.value)}
          >
            <option value="all">All Purposes</option>
            {uniquePurposes.map(purpose => (
              <option key={purpose} value={purpose}>{purpose}</option>
            ))}
          </select>
        </div>
        
        <div className="relative">
          <FiFilter className="absolute left-3 top-3 text-gray-400" />
          <select
            className="pl-10 pr-4 py-2 w-full border rounded"
            value={labFilter}
            onChange={(e) => setLabFilter(e.target.value)}
          >
            <option value="all">All Labs</option>
            {uniqueLabs.map(lab => (
              <option key={lab} value={lab}>{lab}</option>
            ))}
          </select>
        </div>
        
        <div className="relative">
          <FiCalendar className="absolute left-3 top-3 text-gray-400" />
          <select
            className="pl-10 pr-4 py-2 w-full border rounded"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          >
            <option value="all">All Dates</option>
            {uniqueDates.map(date => (
              <option key={date} value={date}>
                {new Date(date).toLocaleDateString()}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-white rounded shadow overflow-hidden mb-4">
        <table className="min-w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 text-left text-xs">Student ID</th>
              <th className="px-4 py-2 text-left text-xs">Name</th>
              <th className="px-4 py-2 text-left text-xs">Purpose</th>
              <th className="px-4 py-2 text-left text-xs">Lab Room</th>
              <th className="px-4 py-2 text-left text-xs">Status</th>
              <th className="px-4 py-2 text-left text-xs">Login Time</th>
              <th className="px-4 py-2 text-left text-xs">Logout Time</th>
              <th className="px-4 py-2 text-left text-xs">Date</th>
              <th className="px-4 py-2 text-left text-xs">Duration (mins)</th>
            </tr>
          </thead>
          <tbody>
            {paginatedReports.length > 0 ? (
              paginatedReports.map(report => (
                <tr key={report.sit_id} className="border-t hover:bg-gray-50 text-xs">
                  <td className="px-4 py-3">{report.idno}</td>
                  <td className="px-4 py-3">{report.name}</td>
                  <td className="px-4 py-3">{report.purpose}</td>
                  <td className="px-4 py-3">{report.labroom}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full ${
                      report.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {report.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">{formatTime(report.login_time)}</td>
                  <td className="px-4 py-3">{formatTime(report.logout_time)}</td>
                  <td className="px-4 py-3">{new Date(report.day).toLocaleDateString()}</td>
                  <td className="px-4 py-3">{report.duration}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="9" className="px-4 py-4 text-center text-gray-500">
                  {reports.length === 0 ? 'No records found' : 'No records match your filters'}
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
          Page {currentPage} of {totalPages} | {filteredReports.length} records
        </span>
        
        <button
          onClick={() => setShowExportModal(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          <FiDownload className="mr-2" /> Export
        </button>
      </div>

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Export Reports</h3>
            
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
                    ref={exportCheckboxRefs.idno}
                  />
                  Student ID
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="mr-2"
                    defaultChecked
                    ref={exportCheckboxRefs.name}
                  />
                  Name
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="mr-2"
                    defaultChecked
                    ref={exportCheckboxRefs.purpose}
                  />
                  Purpose
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="mr-2"
                    defaultChecked
                    ref={exportCheckboxRefs.labroom}
                  />
                  Lab Room
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="mr-2"
                    defaultChecked
                    ref={exportCheckboxRefs.login_time}
                  />
                  Login Time
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="mr-2"
                    defaultChecked
                    ref={exportCheckboxRefs.logout_time}
                  />
                  Logout Time
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="mr-2"
                    defaultChecked
                    ref={exportCheckboxRefs.day}
                  />
                  Date
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="mr-2"
                    defaultChecked
                    ref={exportCheckboxRefs.duration}
                  />
                  Duration
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="mr-2"
                    defaultChecked
                    ref={exportCheckboxRefs.status}
                  />
                  Status
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
        filename="sit-in-reports.csv"
        className="hidden"
        ref={csvLinkRef}
      />
    </div>
  );
}

export default SitinReports;