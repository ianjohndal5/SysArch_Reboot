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
        
        if (!isset($data['idno']) || !isset($data['sit_id'])) {
            throw new Exception('Missing required parameters: idno and sit_id');
        }

        // Start transaction
        $conn->begin_transaction();

        try {
            // 1. Check if student was already rewarded for this sit-in
            $stmt = $conn->prepare("
                SELECT * FROM sitin_rewards 
                WHERE sit_id = ? AND idno = ?
            ");
            $stmt->bind_param("ii", $data['sit_id'], $data['idno']);
            $stmt->execute();
            $result = $stmt->get_result();
            
            if ($result->num_rows > 0) {
                throw new Exception('Student has already been rewarded for this sit-in');
            }

            // 2. Add reward record
            $stmt = $conn->prepare("
                INSERT INTO sitin_rewards (sit_id, idno, rewarded_at)
                VALUES (?, ?, NOW())
            ");
            $stmt->bind_param("ii", $data['sit_id'], $data['idno']);
            if (!$stmt->execute()) {
                throw new Exception("Failed to record reward: " . $conn->error);
            }

            // 3. Get current points for this student
            $stmt = $conn->prepare("SELECT points FROM users WHERE idno = ?");
            $stmt->bind_param("i", $data['idno']);
            $stmt->execute();
            $result = $stmt->get_result();
            $user = $result->fetch_assoc();
            
            if (!$user) {
                throw new Exception('User not found');
            }
            
            $currentPoints = $user['points'] ?? 0;
            $newPoints = $currentPoints + 1;
            
            // 4. Calculate if additional session should be added
            $additionalSessions = 0;
            
            // Check if crossing a multiple of 3 threshold
            if (intdiv($currentPoints, 3) < intdiv($newPoints, 3)) {
                $additionalSessions = 1;
            }
            
            // 5. Update user's points and sessions
            $stmt = $conn->prepare("
                UPDATE users 
                SET points = points + 1, session = session + ? 
                WHERE idno = ?
            ");
            $stmt->bind_param("ii", $additionalSessions, $data['idno']);
            
            if (!$stmt->execute()) {
                throw new Exception("Failed to update user points: " . $conn->error);
            }
            
            // Commit transaction
            $conn->commit();
            
            echo json_encode([
                'success' => true,
                'message' => 'Student rewarded successfully',
                'data' => [
                    'points_added' => 1,
                    'additional_sessions' => $additionalSessions,
                    'new_points' => $newPoints
                ]
            ]);
            
        } catch (Exception $e) {
            // Roll back transaction if any query failed
            $conn->rollback();
            throw $e;
        }
        
    } else {
        throw new Exception('Method not allowed');
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>