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
        $stmt = $conn->prepare("
            SELECT 
                idno, firstname, middlename, lastname, 
                course, level, email, username, 
                session, address
            FROM users 
            WHERE role = 'student'
            ORDER BY lastname, firstname
        ");
        
        if (!$stmt) {
            throw new Exception("Prepare failed: " . $conn->error);
        }
        
        if (!$stmt->execute()) {
            throw new Exception("Execute failed: " . $stmt->error);
        }
        
        $result = $stmt->get_result();
        $students = [];

        while ($row = $result->fetch_assoc()) {
            $students[] = $row;
        }

        // Clear any potential output before sending JSON
        ob_end_clean();
        
        echo json_encode([
            'success' => true,
            'students' => $students
        ]);

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