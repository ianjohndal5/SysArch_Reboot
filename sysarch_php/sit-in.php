<?php
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

require 'connection.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        // Get JSON input
        $json = file_get_contents('php://input');
        $data = json_decode($json, true);
        
        if ($data === null) {
            throw new Exception("Invalid JSON data received");
        }

        // Validate required fields
        $required = ['idno', 'name', 'purpose', 'labroom'];
        foreach ($required as $field) {
            if (empty($data[$field])) {
                throw new Exception("Missing required field: $field");
            }
        }

        // Insert sit-in record
        $insertStmt = $conn->prepare("
            INSERT INTO sitin (idno, name, purpose, labroom) 
            VALUES (?, ?, ?, ?)
        ");
        $insertStmt->bind_param("isss", 
            $data['idno'],
            $data['name'],
            $data['purpose'],
            $data['labroom']
        );
        
        if (!$insertStmt->execute()) {
            throw new Exception("Failed to record sit-in: " . $conn->error);
        }

        echo json_encode([
            'success' => true,
            'message' => 'Sit-in recorded successfully',
            'sit_id' => $conn->insert_id
        ]);

    } catch (Exception $e) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'error' => $e->getMessage()
        ]);
    } finally {
        if (isset($insertStmt)) $insertStmt->close();
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