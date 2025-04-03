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
        $json = file_get_contents('php://input');
        $data = json_decode($json, true);
        
        if (!isset($data['sit_id']) || !isset($data['idno'])) {
            throw new Exception('Missing required parameters: sit_id and idno');
        }

        // Start transaction
        $conn->begin_transaction();

        try {
            // 1. Get the sit-in record first
            $stmt = $conn->prepare("SELECT * FROM sitin WHERE sit_id = ?");
            $stmt->bind_param("i", $data['sit_id']);
            $stmt->execute();
            $sitin = $stmt->get_result()->fetch_assoc();
            
            if (!$sitin) {
                throw new Exception('Sit-in record not found');
            }

            // 2. Update the sit-in record to mark as logged out
            $stmt = $conn->prepare("UPDATE sitin SET logout_time = NOW(), status = 'Logged Out' WHERE sit_id = ?");
            $stmt->bind_param("i", $data['sit_id']);
            
            if (!$stmt->execute()) {
                throw new Exception("Failed to update sit-in record: " . $conn->error);
            }

            // 3. Decrement user's session count
            $stmt = $conn->prepare("UPDATE users SET session = session - 1 WHERE idno = ?");
            $stmt->bind_param("i", $data['idno']);
            
            if (!$stmt->execute()) {
                throw new Exception("Failed to update user session count: " . $conn->error);
            }

            // 4. Insert into history table (if you have one)
            // (Optional - only if you're maintaining a separate history table)
            $stmt = $conn->prepare("
                INSERT INTO lab_history (
                    student_id, 
                    student_name, 
                    lab_name, 
                    purpose, 
                    login_time, 
                    logout_time
                ) VALUES (?, ?, ?, ?, ?, NOW())
            ");
            $stmt->bind_param(
                "issss", 
                $sitin['idno'], 
                $sitin['name'], 
                $sitin['labroom'], 
                $sitin['purpose'], 
                $sitin['login_time']
            );
            
            if (!$stmt->execute()) {
                throw new Exception("Failed to record history: " . $conn->error);
            }

            // Commit transaction if all queries succeeded
            $conn->commit();
            
            echo json_encode([
                'success' => true,
                'message' => 'Logout successful'
            ]);
            
        } catch (Exception $e) {
            // Roll back transaction if any query failed
            $conn->rollback();
            throw $e;
        }
        
        exit();
    }

    // GET request handling remains the same
    $stmt = $conn->prepare("
        SELECT sit_id, idno, name, purpose, labroom, status, login_time, logout_time, day
        FROM sitin
        WHERE logout_time IS NULL
        ORDER BY login_time DESC
    ");
    
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
        'error' => $e->getMessage(),
        'trace' => $e->getTraceAsString() // For debugging
    ]);
}

?>
