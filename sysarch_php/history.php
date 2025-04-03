<?php
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

require 'connection.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
        throw new Exception('Only GET requests are allowed');
    }

    // Get student ID from query parameters
    $idno = isset($_GET['idno']) ? intval($_GET['idno']) : null;
    
    if (!$idno) {
        throw new Exception('Student ID (idno) is required');
    }

    // Query to get lab history for the specific student
    $stmt = $conn->prepare("
        SELECT 
            id,
            student_id as idno,
            student_name as name,
            lab_name as labroom,
            purpose,
            login_time as login,
            logout_time as logout,
            session_date as date,
            feedback_given
        FROM lab_history
        WHERE student_id = ?
        ORDER BY logout_time DESC
    ");
    $stmt->bind_param("i", $idno);
    $stmt->execute();
    $result = $stmt->get_result();
    $history = $result->fetch_all(MYSQLI_ASSOC);

    // Format dates and add status field
    $formattedHistory = array_map(function($record) {
        return [
            'id' => $record['id'],
            'idno' => $record['idno'],
            'name' => $record['name'],
            'purpose' => $record['purpose'],
            'labroom' => $record['labroom'],
            'login' => $record['login'],
            'logout' => $record['logout'],
            'date' => $record['date'] === '0000-00-00' ? 
                substr($record['logout'], 0, 10) : $record['date'],
            'feedbackGiven' => (bool)$record['feedback_given'],
            'status' => 'Logged Out'
        ];
    }, $history);

    echo json_encode([
        'success' => true,
        'data' => $formattedHistory
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'trace' => $e->getTraceAsString()
    ]);
}
?>