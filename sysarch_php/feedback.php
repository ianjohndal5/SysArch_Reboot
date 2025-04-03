<?php
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

require 'connection.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        // Handle POST request for new feedback
        $json = file_get_contents('php://input');
        $data = json_decode($json, true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new Exception('Invalid JSON input');
        }

        // Validate required fields
        if (!isset($data['sessionId']) || !isset($data['rating'])) {
            throw new Exception('Missing required fields: sessionId and rating');
        }

        // Prepare and execute the insert
        $stmt = $conn->prepare("
            INSERT INTO feedback (
                session_id,
                rating,
                comments
            ) VALUES (?, ?, ?)
        ");
        
        $comments = $data['comments'] ?? null;
        $stmt->bind_param("iis", $data['sessionId'], $data['rating'], $comments);
        
        if (!$stmt->execute()) {
            throw new Exception("Failed to save feedback: " . $conn->error);
        }

        // Update lab_history to mark feedback given
        $updateStmt = $conn->prepare("
            UPDATE lab_history 
            SET feedback_given = 1 
            WHERE id = ?
        ");
        $updateStmt->bind_param("i", $data['sessionId']);
        $updateStmt->execute();

        echo json_encode([
            'success' => true,
            'message' => 'Feedback submitted successfully'
        ]);
        exit();
    }

    // Handle GET request to fetch all feedbacks
    $stmt = $conn->prepare("
        SELECT 
            f.id,
            f.session_id,
            f.rating,
            f.comments,
            f.created_at,
            lh.student_id,
            lh.student_name,
            lh.lab_name as lab_room
        FROM feedback f
        JOIN lab_history lh ON f.session_id = lh.id
        ORDER BY f.created_at DESC
    ");
    $stmt->execute();
    $result = $stmt->get_result();
    $feedbacks = $result->fetch_all(MYSQLI_ASSOC);

    echo json_encode([
        'success' => true,
        'data' => $feedbacks
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>