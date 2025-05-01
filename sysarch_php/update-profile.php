<?php
// =============================================
// CORS Headers and Preflight Handling
// =============================================
header("Access-Control-Allow-Origin: *"); // Allow all origins
header("Access-Control-Allow-Methods: *"); // Allow all methods
header("Access-Control-Allow-Headers: *"); // Allow all headers
header("Access-Control-Allow-Credentials: true"); // Allow credentials
header("Access-Control-Max-Age: 86400"); // Cache preflight for 1 day

// Immediately exit for OPTIONS requests (preflight)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit();
}

// =============================================
// Error Reporting Configuration
// =============================================
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', 'php_errors.log');

// =============================================
// Database Connection
// =============================================
require 'connection.php';

// =============================================
// Main Request Handling
// =============================================
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        // =============================================
        // Authentication & Authorization
        // =============================================
        $headers = apache_request_headers();
        $authHeader = $headers['Authorization'] ?? '';
        
        if (empty($authHeader) || !preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
            throw new Exception("Authorization token required", 401);
        }
        
        $token = $matches[1];
        // In a real application, validate the JWT token here
        // This is just a placeholder for token validation
        if (empty($token)) {
            throw new Exception("Invalid authorization token", 401);
        }

        // =============================================
        // Input Validation
        // =============================================
        $json = file_get_contents('php://input');
        $data = json_decode($json, true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new Exception("Invalid JSON data: " . json_last_error_msg(), 400);
        }
        
        // Required fields validation
        $requiredFields = ['idno', 'username', 'email'];
        foreach ($requiredFields as $field) {
            if (empty($data[$field])) {
                throw new Exception("Missing required field: $field", 400);
            }
        }
        
        // Email validation
        if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
            throw new Exception("Invalid email format", 400);
        }

        // =============================================
        // Data Sanitization
        // =============================================
        $idno = $conn->real_escape_string(trim($data['idno']));
        $username = $conn->real_escape_string(trim($data['username']));
        $email = $conn->real_escape_string(trim($data['email']));
        $firstname = isset($data['firstname']) ? $conn->real_escape_string(trim($data['firstname'])) : '';
        $middlename = isset($data['middlename']) ? $conn->real_escape_string(trim($data['middlename'])) : '';
        $lastname = isset($data['lastname']) ? $conn->real_escape_string(trim($data['lastname'])) : '';
        $course = isset($data['course']) ? $conn->real_escape_string(trim($data['course'])) : '';
        $level = isset($data['level']) ? intval($data['level']) : 1;
        $address = isset($data['address']) ? $conn->real_escape_string(trim($data['address'])) : '';

        // =============================================
        // Password Handling (if being updated)
        // =============================================
        $passwordUpdate = '';
        if (!empty($data['password'])) {
            // Verify current password if provided
            if (!empty($data['currentPassword'])) {
                $stmt = $conn->prepare("SELECT password FROM users WHERE idno = ?");
                $stmt->bind_param("s", $idno);
                $stmt->execute();
                $result = $stmt->get_result();
                
                if ($result->num_rows === 0) {
                    throw new Exception("User not found", 404);
                }
                
                $user = $result->fetch_assoc();
                if (!password_verify($data['currentPassword'], $user['password'])) {
                    throw new Exception("Current password is incorrect", 401);
                }
            } else {
                throw new Exception("Current password is required for password changes", 400);
            }
            
            // Validate new password
            if (strlen($data['password']) < 8) {
                throw new Exception("Password must be at least 8 characters", 400);
            }
            
            $password = password_hash($data['password'], PASSWORD_DEFAULT);
            $passwordUpdate = ", password = '$password'";
        }

        // =============================================
        // Update Query
        // =============================================
        $query = "UPDATE users SET 
                  username = '$username',
                  email = '$email',
                  firstname = '$firstname',
                  middlename = '$middlename',
                  lastname = '$lastname',
                  course = '$course',
                  level = $level,
                  address = '$address'
                  $passwordUpdate
                  WHERE idno = '$idno'";

        if (!$conn->query($query)) {
            throw new Exception("Database update failed: " . $conn->error, 500);
        }

        // =============================================
        // Fetch Updated User Data
        // =============================================
        $stmt = $conn->prepare("SELECT * FROM users WHERE idno = ?");
        $stmt->bind_param("s", $idno);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows === 0) {
            throw new Exception("User not found after update", 404);
        }
        
        $updatedUser = $result->fetch_assoc();
        
        // Remove sensitive data before returning
        unset($updatedUser['password']);
        unset($updatedUser['token']);

        // =============================================
        // Success Response
        // =============================================
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'message' => 'Profile updated successfully',
            'user' => $updatedUser
        ]);

    } catch (Exception $e) {
        // =============================================
        // Error Handling
        // =============================================
        $statusCode = $e->getCode() >= 400 && $e->getCode() < 600 ? $e->getCode() : 500;
        http_response_code($statusCode);
        
        echo json_encode([
            'success' => false,
            'error' => $e->getMessage(),
            'code' => $statusCode
        ]);
        
    } finally {
        // =============================================
        // Cleanup
        // =============================================
        if (isset($stmt)) $stmt->close();
        $conn->close();
    }
} else {
    // =============================================
    // Method Not Allowed
    // =============================================
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'error' => 'Method Not Allowed',
        'allowed_methods' => ['POST']
    ]);
}
?>