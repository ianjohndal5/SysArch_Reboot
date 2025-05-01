<?php
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

require 'connection.php';

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        // Get and validate JSON input
        $json = file_get_contents('php://input');
        $data = json_decode($json, true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new Exception("Invalid JSON data received");
        }

        // Validate required fields
        $required = ['idno', 'name', 'purpose', 'labroom'];
        foreach ($required as $field) {
            if (empty($data[$field])) {
                throw new Exception("Missing required field: $field");
            }
        }

        // Start transaction
        $conn->begin_transaction();

        try {
            // 1. Check if student is already sitting in any lab
            $checkActive = $conn->prepare("
                SELECT sit_id FROM sitin 
                WHERE idno = ? AND status = 'Active'
                LIMIT 1
            ");
            $checkActive->bind_param("i", $data['idno']);
            $checkActive->execute();
            
            if ($checkActive->get_result()->num_rows > 0) {
                throw new Exception("Student is already sitting in another lab");
            }

            // 2. Check session availability
            $checkSession = $conn->prepare("
                SELECT session FROM users 
                WHERE idno = ? FOR UPDATE
            ");
            $checkSession->bind_param("i", $data['idno']);
            $checkSession->execute();
            $sessionResult = $checkSession->get_result();
            
            if ($sessionResult->num_rows === 0) {
                throw new Exception("Student not found");
            }
            
            $sessionData = $sessionResult->fetch_assoc();
            if ($sessionData['session'] <= 0) {
                throw new Exception("Student Already sitin");
            }

            // 3. Record new sit-in
            $insertSitIn = $conn->prepare("
                INSERT INTO sitin (idno, name, purpose, labroom, status, login_time)
                VALUES (?, ?, ?, ?, 'Active', NOW())
            ");
            $insertSitIn->bind_param("isss", 
                $data['idno'],
                $data['name'],
                $data['purpose'],
                $data['labroom']
            );
            
            if (!$insertSitIn->execute()) {
                throw new Exception("Failed to record sit-in: " . $conn->error);
            }

            // 4. Deduct session
            $updateSession = $conn->prepare("
                UPDATE users SET session = session - 1 
                WHERE idno = ?
            ");
            $updateSession->bind_param("i", $data['idno']);
            
            if (!$updateSession->execute()) {
                throw new Exception("Failed to update session count");
            }

            // Commit transaction
            $conn->commit();

            http_response_code(201);
            echo json_encode([
                'success' => true,
                'message' => 'Sit-in recorded successfully',
                'sit_id' => $conn->insert_id,
                'remaining_sessions' => $sessionData['session'] - 1
            ]);

        } catch (Exception $e) {
            $conn->rollback();
            throw $e;
        }
    } catch (Exception $e) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'error' => $e->getMessage()
        ]);
    }
} else {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'error' => 'Method not allowed'
    ]);
}
?>