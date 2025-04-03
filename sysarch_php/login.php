<?php
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

// Disable HTML errors
ini_set('display_errors', 0);
ini_set('html_errors', 0);

// Include connection with output buffering
ob_start();
require 'connection.php';
ob_end_clean();

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        // Get and validate JSON input
        $json = file_get_contents('php://input');
        $data = json_decode($json, true);
        
        if ($data === null) {
            throw new Exception("Invalid JSON data received");
        }

        // Validate required fields
        if (empty($data['username']) || empty($data['password'])) {
            throw new Exception("Username and password are required");
        }

        $username = $conn->real_escape_string($data['username']);

        // Get user with prepared statement (now including role)
        $stmt = $conn->prepare("SELECT idno, username, password, role FROM users WHERE username = ?");
        $stmt->bind_param("s", $username);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($result->num_rows === 0) {
            throw new Exception("User not found");
        }

        $user = $result->fetch_assoc();
        
        if (!password_verify($data['password'], $user['password'])) {
            throw new Exception("Invalid password");
        }

        // Login successful - include role in response
        echo json_encode([
            'success' => true,
            'message' => 'Login successful',
            'user' => [
                'idno' => $user['idno'],
                'username' => $user['username'],
                'role' => $user['role'] // Include the role in response
            ]
        ]);

    } catch (Exception $e) {
        http_response_code(401);
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
        'error' => 'Only POST requests are allowed'
    ]);
}
?>