<?php
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

// Disable HTML errors
ini_set('display_errors', 0);
ini_set('html_errors', 0);

// Start output buffering
ob_start();
require 'connection.php';
ob_end_clean();

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Main POST request handling
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        // Get and validate JSON input
        $json = file_get_contents('php://input');
        $data = json_decode($json, true);
        
        if ($data === null) {
            throw new Exception("Invalid JSON data received");
        }

        // Validate required fields
        $requiredFields = ['idno', 'firstname', 'lastname', 'username', 'password', 'email'];
        $missingFields = [];
        
        foreach ($requiredFields as $field) {
            if (empty($data[$field])) {
                $missingFields[] = $field;
            }
        }
        
        if (!empty($missingFields)) {
            throw new Exception("Missing required fields: " . implode(', ', $missingFields));
        }

        // Validate ID number is positive
        if (!is_numeric($data['idno']) || $data['idno'] <= 0) {
            throw new Exception("ID number must be a positive number");
        }

        // Sanitize inputs
        $idno = $conn->real_escape_string($data['idno']);
        $username = $conn->real_escape_string($data['username']);
        $email = $conn->real_escape_string($data['email']);
        $firstname = $conn->real_escape_string($data['firstname']);
        $lastname = $conn->real_escape_string($data['lastname']);
        $middlename = isset($data['middlename']) ? $conn->real_escape_string($data['middlename']) : '';
        $course = isset($data['course']) ? $conn->real_escape_string($data['course']) : '';
        $level = isset($data['level']) ? $conn->real_escape_string($data['level']) : '';
        $address = isset($data['address']) ? $conn->real_escape_string($data['address']) : '';
        $password = password_hash($data['password'], PASSWORD_DEFAULT);

        // Check for existing ID, username, or email
        $checkQuery = "SELECT 
                        SUM(idno = '$idno') as id_exists,
                        SUM(username = '$username') as username_exists,
                        SUM(email = '$email') as email_exists
                      FROM users";
        $checkResult = $conn->query($checkQuery);
        
        if (!$checkResult) {
            throw new Exception("Database check failed: " . $conn->error);
        }

        $exists = $checkResult->fetch_assoc();
        
        if ($exists['id_exists'] > 0) {
            throw new Exception("ID number already registered");
        }
        
        if ($exists['username_exists'] > 0) {
            throw new Exception("Username already taken");
        }
        
        if ($exists['email_exists'] > 0) {
            throw new Exception("Email already registered");
        }

        // Prepare and execute insert query
        $stmt = $conn->prepare("INSERT INTO users (
            idno, username, email, firstname, middlename, lastname, 
            course, level, address, password
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        
        $stmt->bind_param(
            "ssssssssss",
            $idno,
            $username,
            $email,
            $firstname,
            $middlename,
            $lastname,
            $course,
            $level,
            $address,
            $password
        );

        if (!$stmt->execute()) {
            throw new Exception("Registration failed: " . $stmt->error);
        }

        // Success response
        http_response_code(201);
        echo json_encode([
            'success' => true,
            'message' => 'Registration successful'
        ]);

    } catch (Exception $e) {
        // Error response
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
    // Method not allowed
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'error' => 'Only POST requests are allowed'
    ]);
}
?>