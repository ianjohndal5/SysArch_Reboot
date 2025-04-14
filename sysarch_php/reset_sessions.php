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
    
    if (!isset($data['session_value'])) {
        throw new Exception('Session value is required');
    }

    $sessionValue = (int)$data['session_value'];
    $stmt = $conn->prepare("UPDATE users SET session = ?");
    $stmt->bind_param("i", $sessionValue);

    if ($stmt->execute()) {
        $response['success'] = true;
        $response['updated_count'] = $conn->affected_rows;
    } else {
        throw new Exception("Reset failed: " . $stmt->error);
    }
} catch (Exception $e) {
    $response['error'] = $e->getMessage();
    http_response_code(400);
} finally {
    echo json_encode($response);
    $conn->close();
}
?>