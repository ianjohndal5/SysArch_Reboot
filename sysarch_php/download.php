<?php
require 'connection.php';

// Get the resource ID from the query string
if (!isset($_GET['id']) || empty($_GET['id'])) {
    http_response_code(400);
    echo "Resource ID is required";
    exit();
}

$resource_id = $_GET['id'];

try {
    // Get resource information
    $stmt = $conn->prepare("SELECT * FROM resources WHERE resource_id = ? AND is_enabled = 1");
    $stmt->bind_param("i", $resource_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $resource = $result->fetch_assoc();
    
    if (!$resource) {
        http_response_code(404);
        echo "Resource not found or is disabled";
        exit();
    }
    
    $file_path = $resource['file_path'];
    
    // Check if file exists
    if (!file_exists($file_path)) {
        http_response_code(404);
        echo "File not found on server";
        exit();
    }
    
    // Set appropriate headers for download
    header('Content-Description: File Transfer');
    header('Content-Type: ' . $resource['file_type']);
    header('Content-Disposition: attachment; filename="' . basename($file_path) . '"');
    header('Expires: 0');
    header('Cache-Control: must-revalidate');
    header('Pragma: public');
    header('Content-Length: ' . filesize($file_path));
    
    // Clear output buffer
    ob_clean();
    flush();
    
    // Read file and output
    readfile($file_path);
    exit();
    
} catch (Exception $e) {
    http_response_code(500);
    echo "Error: " . $e->getMessage();
}
?>
