<?php
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
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
        // Get authorization header
        $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
        $token = str_replace('Bearer ', '', $authHeader);
        
        // In a real app, you would validate the token here
        // For now, we'll just check if it exists
        if (empty($token)) {
            throw new Exception("Authorization token required");
        }

        // Get and validate JSON input
        $json = file_get_contents('php://input');
        $data = json_decode($json, true);
        
        if ($data === null) {
            throw new Exception("Invalid JSON data received");
        }

        // Validate required fields
        if (empty($data['idno']) || empty($data['username']) || empty($data['email'])) {
            throw new Exception("ID, username and email are required");
        }

        // Sanitize inputs
        $idno = $conn->real_escape_string($data['idno']);
        $firstname = $conn->real_escape_string($data['firstname']);
        $username = $conn->real_escape_string($data['username']);
        $email = $conn->real_escape_string($data['email']);
        $firstname = isset($data['firstname']) ? $conn->real_escape_string($data['firstname']) : '';
        $middlename = isset($data['middlename']) ? $conn->real_escape_string($data['middlename']) : '';
        $lastname = isset($data['lastname']) ? $conn->real_escape_string($data['lastname']) : '';
        $course = isset($data['course']) ? $conn->real_escape_string($data['course']) : '';
        $level = isset($data['level']) ? $conn->real_escape_string($data['level']) : '';
        $address = isset($data['address']) ? $conn->real_escape_string($data['address']) : '';

        // Check if password is being updated
        $passwordUpdate = '';
        if (!empty($data['password'])) {
            $password = password_hash($data['password'], PASSWORD_DEFAULT);
            $passwordUpdate = ", password = '$password'";
        }

        // Prepare update query
        $query = "UPDATE users SET 
                  username = '$username',
                  email = '$email',
                  firstname = '$firstname',
                  middlename = '$middlename',
                  lastname = '$lastname',
                  course = '$course',
                  level = '$level',
                  address = '$address'
                  $passwordUpdate
                  WHERE idno = '$idno'";

        if (!$conn->query($query)) {
            throw new Exception("Update failed: " . $conn->error);
        }

        // Get updated user data
        $stmt = $conn->prepare("SELECT * FROM users WHERE idno = ?");
        $stmt->bind_param("s", $idno);
        $stmt->execute();
        $result = $stmt->get_result();
        $updatedUser = $result->fetch_assoc();

        // Success response
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'message' => 'Profile updated successfully',
            'user' => $updatedUser
        ]);

    } catch (Exception $e) {
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
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'error' => 'Only POST requests are allowed'
    ]);
}
?>