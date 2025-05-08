<?php
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

require 'connection.php';

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Create upload directory if it doesn't exist
$upload_dir = 'uploads/';
if (!file_exists($upload_dir)) {
    mkdir($upload_dir, 0777, true);
}

try {
    // GET request - Fetch resources
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        // Check if specific resource is requested
        if (isset($_GET['resource_id'])) {
            $stmt = $conn->prepare("SELECT * FROM resources WHERE resource_id = ?");
            $stmt->bind_param("i", $_GET['resource_id']);
            $stmt->execute();
            $result = $stmt->get_result();
            $resource = $result->fetch_assoc();
            
            if ($resource) {
                echo json_encode([
                    'success' => true,
                    'data' => $resource
                ]);
            } else {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'error' => 'Resource not found'
                ]);
            }
            exit();
        }
        
        // Check if we should filter by enabled/disabled
        $where_clause = "";
        $params = [];
        $types = "";
        
        if (isset($_GET['enabled'])) {
            $enabled = $_GET['enabled'] === '1' || $_GET['enabled'] === 'true' ? 1 : 0;
            $where_clause = "WHERE is_enabled = ?";
            $params[] = $enabled;
            $types .= "i";
        }
        
        $query = "SELECT r.*, u.firstname, u.lastname FROM resources r 
                 JOIN users u ON r.uploaded_by = u.idno " . $where_clause . " 
                 ORDER BY r.uploaded_at DESC";
                 
        $stmt = $conn->prepare($query);
        if (!empty($params)) {
            $stmt->bind_param($types, ...$params);
        }
        
        $stmt->execute();
        $result = $stmt->get_result();
        $resources = $result->fetch_all(MYSQLI_ASSOC);
        
        echo json_encode([
            'success' => true,
            'data' => $resources
        ]);
        exit();
    }
    
    // POST request - Upload new resource
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
      
        
        // Validate required fields
        if (!isset($_POST['title']) || empty($_POST['title'])) {
            throw new Exception('Resource title is required');
        }
        
        if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
            throw new Exception('File upload failed: ' . getUploadErrorMessage($_FILES['file']['error']));
        }
        
        // Process the uploaded file
        $file = $_FILES['file'];
        $filename = time() . '_' . basename($file['name']);
        $target_path = $upload_dir . $filename;
        
        // Check file size (limit to 50MB)
        if ($file['size'] > 50 * 1024 * 1024) {
            throw new Exception('File size exceeds the limit (50MB)');
        }
        
        // Check file type
        $allowed_types = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 
                         'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                         'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                         'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                         'text/plain', 'application/zip', 'application/x-rar-compressed'];
        
        $file_type = mime_content_type($file['tmp_name']);
        if (!in_array($file_type, $allowed_types)) {
            throw new Exception('File type not allowed');
        }
        
        // Move uploaded file
        if (!move_uploaded_file($file['tmp_name'], $target_path)) {
            throw new Exception('Failed to move uploaded file');
        }
        
        // Save resource info to database
        $stmt = $conn->prepare("
            INSERT INTO resources (
                title, description, file_path, file_type, file_size, is_enabled, uploaded_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        ");
        
        $title = $_POST['title'];
        $description = isset($_POST['description']) ? $_POST['description'] : '';
        $is_enabled = isset($_POST['is_enabled']) ? ($_POST['is_enabled'] == '1' ? 1 : 0) : 1;
        $uploaded_by = $_POST['idno'];
        
        $stmt->bind_param("ssssiis", 
            $title,
            $description,
            $target_path,
            $file_type,
            $file['size'],
            $is_enabled,
            $uploaded_by
        );
        
        if (!$stmt->execute()) {
            // Delete the uploaded file if database insert fails
            unlink($target_path);
            throw new Exception("Failed to save resource: " . $conn->error);
        }
        
        $resource_id = $stmt->insert_id;
        
        echo json_encode([
            'success' => true,
            'message' => 'Resource uploaded successfully',
            'data' => [
                'resource_id' => $resource_id,
                'file_path' => $target_path
            ]
        ]);
        exit();
    }
    
    // PUT request - Update resource
    if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
        $json = file_get_contents('php://input');
        $data = json_decode($json, true);

        
        if (!isset($data['resource_id'])) {
            throw new Exception('Resource ID is required');
        }
        
        // Build update query dynamically
        $updates = [];
        $params = [];
        $types = "";
        
        if (isset($data['title'])) {
            $updates[] = "title = ?";
            $params[] = $data['title'];
            $types .= "s";
        }
        
        if (isset($data['description'])) {
            $updates[] = "description = ?";
            $params[] = $data['description'];
            $types .= "s";
        }
        
        if (isset($data['is_enabled'])) {
            $updates[] = "is_enabled = ?";
            $params[] = $data['is_enabled'] ? 1 : 0;
            $types .= "i";
        }
        
        // Add resource_id as the last parameter
        $params[] = $data['resource_id'];
        $types .= "i";
        
        $query = "UPDATE resources SET " . implode(", ", $updates) . " WHERE resource_id = ?";
        
        $stmt = $conn->prepare($query);
        $stmt->bind_param($types, ...$params);
        
        if (!$stmt->execute()) {
            throw new Exception("Failed to update resource: " . $conn->error);
        }
        
        if ($stmt->affected_rows === 0) {
            http_response_code(404);
            echo json_encode([
                'success' => false,
                'error' => 'Resource not found or no changes made'
            ]);
            exit();
        }
        
        echo json_encode([
            'success' => true,
            'message' => 'Resource updated successfully'
        ]);
        exit();
    }
    
    // DELETE request - Remove resource
    if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
        $json = file_get_contents('php://input');
        $data = json_decode($json, true);
        
        if (!isset($data['resource_id'])) {
            throw new Exception('Resource ID is required');
        }
        
        // Get file path before deleting
        $stmt = $conn->prepare("SELECT file_path FROM resources WHERE resource_id = ?");
        $stmt->bind_param("i", $data['resource_id']);
        $stmt->execute();
        $result = $stmt->get_result();
        $resource = $result->fetch_assoc();
        
        if (!$resource) {
            http_response_code(404);
            echo json_encode([
                'success' => false,
                'error' => 'Resource not found'
            ]);
            exit();
        }
        
        // Delete from database
        $stmt = $conn->prepare("DELETE FROM resources WHERE resource_id = ?");
        $stmt->bind_param("i", $data['resource_id']);
        
        if (!$stmt->execute()) {
            throw new Exception("Failed to delete resource: " . $conn->error);
        }
        
        // Delete file from server
        if (file_exists($resource['file_path'])) {
            unlink($resource['file_path']);
        }
        
        echo json_encode([
            'success' => true,
            'message' => 'Resource deleted successfully'
        ]);
        exit();
    }
    
    // If we reach here, the request method is not supported
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'error' => 'Method not allowed'
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}


// Helper function to get upload error message
function getUploadErrorMessage($error_code) {
    switch ($error_code) {
        case UPLOAD_ERR_INI_SIZE:
            return "The uploaded file exceeds the upload_max_filesize directive in php.ini";
        case UPLOAD_ERR_FORM_SIZE:
            return "The uploaded file exceeds the MAX_FILE_SIZE directive in the HTML form";
        case UPLOAD_ERR_PARTIAL:
            return "The uploaded file was only partially uploaded";
        case UPLOAD_ERR_NO_FILE:
            return "No file was uploaded";
        case UPLOAD_ERR_NO_TMP_DIR:
            return "Missing a temporary folder";
        case UPLOAD_ERR_CANT_WRITE:
            return "Failed to write file to disk";
        case UPLOAD_ERR_EXTENSION:
            return "A PHP extension stopped the file upload";
        default:
            return "Unknown upload error";
    }
}
?>
