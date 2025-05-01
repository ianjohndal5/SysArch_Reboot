<?php
// Enable output buffering to prevent accidental output
ob_start();

// Set headers first
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

// Disable HTML errors
ini_set('display_errors', 0);
ini_set('html_errors', 0);

// Include database connection
require 'connection.php';

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        // Get authorization header
        $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
        $token = str_replace('Bearer ', '', $authHeader);
        
        if (empty($token)) {
            throw new Exception("Authorization token required");
        }

        // Get user ID from query params
        $idno = $_GET['idno'] ?? '';
        if (empty($idno)) {
            throw new Exception("User ID is required");
        }

        // Fetch user data - EXPLICITLY select all expected fields
        $stmt = $conn->prepare("
            SELECT * FROM users 
            WHERE idno = ?
        ");
        
        if (!$stmt) {
            throw new Exception("Prepare failed: " . $conn->error);
        }
        
        $stmt->bind_param("s", $idno);
        
        if (!$stmt->execute()) {
            throw new Exception("Execute failed: " . $stmt->error);
        }
        
        $result = $stmt->get_result();
        
        if ($result->num_rows === 0) {
            throw new Exception("User not found");
        }

        $user = $result->fetch_assoc();
        
        // Define expected fields with defaults (as backup)
        $expectedFields = [
            'idno' => '',
            'firstname' => '',
            'middlename' => '',
            'lastname' => '',
            'course' => '',
            'level' => 1,
            'email' => '',
            'address' => '',
            'username' => '',
            'session' => 0,
            'registeredat' => null,
        ];
        
        // Merge with defaults to ensure all fields exist
        $user = array_merge($expectedFields, $user);
        
        // Clean any output before sending JSON
        ob_end_clean();
        
        // Success response
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'user' => $user
        ]);

    } catch (Exception $e) {
        ob_end_clean();
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'error' => $e->getMessage()
        ]);
    } finally {
        if (isset($stmt)) $stmt->close();
        $conn->close();
    }
} else {
    ob_end_clean();
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'error' => 'Only GET requests are allowed'
    ]);
}
?>