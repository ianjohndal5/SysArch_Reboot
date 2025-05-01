<?php
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

require 'connection.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$response = ['success' => false, 'error' => ''];

try {
    $json = file_get_contents('php://input');
    $data = json_decode($json, true);
    
    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception('Invalid JSON input');
    }

    $requiredFields = ['idno', 'firstname', 'lastname', 'course', 'level', 'email', 'username'];
    foreach ($requiredFields as $field) {
        if (empty($data[$field])) {
            throw new Exception("Missing required field: $field");
        }
    }

    // Ensure all values are properly set and not null
    $firstname = $data['firstname'];
    $lastname = $data['lastname'];
    $middlename = isset($data['middlename']) ? $data['middlename'] : '';
    $course = $data['course'];
    $level = (int)$data['level'];
    $email = $data['email'];
    $username = $data['username'];
    $address = isset($data['address']) ? $data['address'] : '';
    $idno = $data['idno'];
    $session = (int)$data['session'];
    
    $stmt = $conn->prepare("
        UPDATE users 
        SET firstname = ?, lastname = ?, middlename = ?, course = ?, level = ?, 
            email = ?, username = ?, address = ?, session = ?
        WHERE idno = ?
    ");
    
    if (!$stmt) {
        throw new Exception("Prepare failed: " . $conn->error);
    }

    // Corrected bind_param - now matches the SQL query order
    // 9 string params + 1 integer (idno) = "ssssissssi"
    $stmt->bind_param(
        "ssssissssi", 
        $firstname,
        $lastname,
        $middlename,
        $course,
        $level,
        $email,
        $username,
        $address,
        $session,
        $idno
    );

    if ($stmt->execute()) {
        $response['success'] = true;
    } else {
        throw new Exception("Update failed: " . $stmt->error);
    }
} catch (Exception $e) {
    $response['error'] = $e->getMessage();
    http_response_code(400);
}

echo json_encode($response);
$conn->close();
exit();
?>