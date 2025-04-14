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
    
    if (empty($data['idno'])) {
        throw new Exception('User ID is required');
    }

    $idno = $data['idno'];

    // Start transaction
    $conn->begin_transaction();

    // 1. First delete feedback records that reference sitin sessions of this student
    $deleteFeedback = $conn->prepare("DELETE feedback FROM feedback 
                                    JOIN sitin ON feedback.session_id = sitin.sit_id 
                                    WHERE sitin.idno = ?");
    if (!$deleteFeedback) {
        throw new Exception("Prepare failed for feedback deletion: " . $conn->error);
    }
    $deleteFeedback->bind_param("i", $idno);
    if (!$deleteFeedback->execute()) {
        throw new Exception("Feedback deletion failed: " . $deleteFeedback->error);
    }

    // 2. Delete lab history records
    $deleteLabHistory = $conn->prepare("DELETE FROM lab_history WHERE student_id = ?");
    if (!$deleteLabHistory) {
        throw new Exception("Prepare failed for lab_history deletion: " . $conn->error);
    }
    $deleteLabHistory->bind_param("i", $idno);
    if (!$deleteLabHistory->execute()) {
        throw new Exception("lab_history deletion failed: " . $deleteLabHistory->error);
    }

    // 3. Delete sitin records for this student
    $deleteSitin = $conn->prepare("DELETE FROM sitin WHERE idno = ?");
    if (!$deleteSitin) {
        throw new Exception("Prepare failed for sitin deletion: " . $conn->error);
    }
    $deleteSitin->bind_param("i", $idno);
    if (!$deleteSitin->execute()) {
        throw new Exception("Sitin deletion failed: " . $deleteSitin->error);
    }

    // 4. Finally delete the student from users table
    $deleteStudent = $conn->prepare("DELETE FROM users WHERE idno = ?");
    if (!$deleteStudent) {
        throw new Exception("Prepare failed for student deletion: " . $conn->error);
    }
    $deleteStudent->bind_param("i", $idno);
    if (!$deleteStudent->execute()) {
        throw new Exception("Student deletion failed: " . $deleteStudent->error);
    }

    // Commit transaction if all operations succeeded
    $conn->commit();
    $response['success'] = true;

} catch (Exception $e) {
    // Rollback transaction on error
    if ($conn) {
        $conn->rollback();
    }
    $response['error'] = $e->getMessage();
    http_response_code(400);
} finally {
    echo json_encode($response);
    if ($conn) {
        $conn->close();
    }
}
?>