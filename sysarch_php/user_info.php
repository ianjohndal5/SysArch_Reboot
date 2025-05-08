<?php
// Start output buffering to catch any accidental output
ob_start();

// Set headers first
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

// Include connection (after headers)
require 'connection.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        // Check if idno is provided
        if (!isset($_GET['idno'])) {
            throw new Exception("ID number is required");
        }
        
        $idno = $_GET['idno'];
        
        // Prepare statement to get user info
        $stmt = $conn->prepare("
            SELECT 
                idno, firstname, middlename, lastname, 
                course, level, email, username, 
                session, address, role
            FROM users 
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
        
        if ($result->num_rows > 0) {
            $data = $result->fetch_assoc();
            
            // Clear any potential output before sending JSON
            ob_end_clean();
            
            echo json_encode([
                'success' => true,
                'data' => $data
            ]);
        } else {
            // No user found with that ID
            ob_end_clean();
            http_response_code(404);
            echo json_encode([
                'success' => false,
                'error' => 'User not found'
            ]);
        }
    } catch (Exception $e) {
        ob_end_clean();
        http_response_code(500);
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