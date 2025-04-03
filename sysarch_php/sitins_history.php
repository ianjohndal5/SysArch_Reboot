<?php
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

require 'connection.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    $dateFilter = isset($_GET['date']) ? $_GET['date'] : null;
    
    $query = "SELECT sit_id, idno, name, purpose, labroom, status, login_time, logout_time, day FROM sitin";
    
    if ($dateFilter === 'today') {
        $query .= " WHERE day = CURDATE()";
    } elseif ($dateFilter && $dateFilter !== 'all') {
        $query .= " WHERE day = ?";
    }
    
    $query .= " ORDER BY login_time DESC";
    
    $stmt = $conn->prepare($query);
    
    if ($dateFilter && $dateFilter !== 'today' && $dateFilter !== 'all') {
        $stmt->bind_param("s", $dateFilter);
    }
    
    $stmt->execute();
    $result = $stmt->get_result();
    $sitins = $result->fetch_all(MYSQLI_ASSOC);
    
    echo json_encode([
        'success' => true,
        'data' => $sitins
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>