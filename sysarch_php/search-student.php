<?php
// Enable CORS and set headers
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

// Include connection file
require 'connection.php';

// Handle OPTIONS request for CORS preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        if (!isset($_GET['idno'])) {
            throw new Exception("Student ID is required");
        }

        $idno = $conn->real_escape_string($_GET['idno']);

        $stmt = $conn->prepare("
            SELECT idno, CONCAT(firstname, ' ', lastname) AS name, 
                   course, level 
            FROM users 
            WHERE idno = ? AND role = 'student'
        ");
        $stmt->bind_param("i", $idno);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($result->num_rows === 0) {
            throw new Exception("Student not found");
        }

        $student = $result->fetch_assoc();
        
        echo json_encode([
            'success' => true,
            'student' => $student
        ]);

    } catch (Exception $e) {
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'error' => $e->getMessage()
        ]);
    } finally {
        if (isset($stmt)) $stmt->close();
        $conn->close();
    }
} else {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'error' => 'Only GET requests are allowed'
    ]);
}
?>