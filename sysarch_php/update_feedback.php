<?php
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

require 'connection.php';

try {
    $json = file_get_contents('php://input');
    $data = json_decode($json, true);
    
    if (empty($data['feedbackId'])) {
        throw new Exception('Feedback ID is required');
    }

    $resolved = isset($data['status']) ? (int)$data['status'] : 0;
    $response = isset($data['response']) ? $data['response'] : null;

    $stmt = $conn->prepare("
        UPDATE feedback 
        SET 
            resolved = ?,
            admin_response = ?
        WHERE id = ?
    ");
    $stmt->bind_param("isi", $resolved, $response, $data['feedbackId']);
    
    if (!$stmt->execute()) {
        throw new Exception("Failed to update feedback: " . $conn->error);
    }

    echo json_encode([
        'success' => true,
        'message' => 'Feedback updated successfully'
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>