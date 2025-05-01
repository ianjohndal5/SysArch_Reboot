<?php
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

require 'connection.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        // Get all labs with their schedules grouped by day
        $query = "
            SELECT 
                l.lab_id, 
                l.lab_name, 
                l.description, 
                l.capacity,
                l.is_active,
                ls.schedule_id,
                ls.day_of_week,
                ls.start_time,
                ls.end_time,
                ls.is_available
            FROM 
                labs l
            LEFT JOIN 
                lab_schedules ls ON l.lab_id = ls.lab_id
            ORDER BY 
                l.lab_name, 
                FIELD(ls.day_of_week, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'),
                ls.start_time
        ";

        $stmt = $conn->prepare($query);
        $stmt->execute();
        $result = $stmt->get_result();

        $labs = [];
        while ($row = $result->fetch_assoc()) {
            $labId = $row['lab_id'];
            
            if (!isset($labs[$labId])) {
                $labs[$labId] = [
                    'lab_id' => $row['lab_id'],
                    'lab_name' => $row['lab_name'],
                    'description' => $row['description'],
                    'capacity' => $row['capacity'],
                    'is_active' => (bool)$row['is_active'],
                    'schedules' => []
                ];
            }
            
            if ($row['schedule_id']) {
                if (!isset($labs[$labId]['schedules'][$row['day_of_week']])) {
                    $labs[$labId]['schedules'][$row['day_of_week']] = [];
                }
                $labs[$labId]['schedules'][$row['day_of_week']][] = [
                    'schedule_id' => $row['schedule_id'],
                    'start_time' => $row['start_time'],
                    'end_time' => $row['end_time'],
                    'is_available' => (bool)$row['is_available']
                ];
            }
        }

        echo json_encode([
            'success' => true,
            'data' => array_values($labs)
        ]);

    } elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $json = file_get_contents('php://input');
        $data = json_decode($json, true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new Exception("Invalid JSON data received");
        }

        $conn->begin_transaction();

        try {
            if (empty($data['lab_id'])) {
                // Create new lab
                $stmt = $conn->prepare("
                    INSERT INTO labs (lab_name, description, capacity, is_active)
                    VALUES (?, ?, ?, ?)
                ");
                $stmt->bind_param("ssii",
                    $data['lab_name'],
                    $data['description'],
                    $data['capacity'],
                    $data['is_active']
                );
                
                if (!$stmt->execute()) {
                    throw new Exception("Failed to create lab: " . $conn->error);
                }
                
                $labId = $conn->insert_id;
            } else {
                // Update existing lab
                $labId = $data['lab_id'];
                
                $updateFields = [];
                $params = [];
                $types = '';
                
                if (isset($data['lab_name'])) {
                    $updateFields[] = 'lab_name = ?';
                    $params[] = $data['lab_name'];
                    $types .= 's';
                }
                
                if (isset($data['description'])) {
                    $updateFields[] = 'description = ?';
                    $params[] = $data['description'];
                    $types .= 's';
                }
                
                if (isset($data['capacity'])) {
                    $updateFields[] = 'capacity = ?';
                    $params[] = $data['capacity'];
                    $types .= 'i';
                }
                
                if (isset($data['is_active'])) {
                    $updateFields[] = 'is_active = ?';
                    $params[] = $data['is_active'];
                    $types .= 'i';
                }
                
                if (!empty($updateFields)) {
                    $params[] = $labId;
                    $types .= 'i';
                    
                    $stmt = $conn->prepare("
                        UPDATE labs 
                        SET " . implode(', ', $updateFields) . "
                        WHERE lab_id = ?
                    ");
                    $stmt->bind_param($types, ...$params);
                    
                    if (!$stmt->execute()) {
                        throw new Exception("Failed to update lab: " . $conn->error);
                    }
                }
            }

            // Update schedules if provided
            if (!empty($data['schedules'])) {
                // First delete all existing schedules for this lab
                $stmt = $conn->prepare("DELETE FROM lab_schedules WHERE lab_id = ?");
                $stmt->bind_param("i", $labId);
                if (!$stmt->execute()) {
                    throw new Exception("Failed to clear existing schedules: " . $conn->error);
                }

                // Then insert the new schedules
                $stmt = $conn->prepare("
                    INSERT INTO lab_schedules 
                    (lab_id, day_of_week, start_time, end_time, is_available)
                    VALUES (?, ?, ?, ?, ?)
                ");
                
                foreach ($data['schedules'] as $day => $timeSlots) {
                    foreach ($timeSlots as $slot) {
                        $stmt->bind_param("isssi",
                            $labId,
                            $day,
                            $slot['start_time'],
                            $slot['end_time'],
                            $slot['is_available']
                        );
                        
                        if (!$stmt->execute()) {
                            throw new Exception("Failed to insert schedule: " . $conn->error);
                        }
                    }
                }
            }

            $conn->commit();
            
            echo json_encode([
                'success' => true,
                'message' => 'Lab saved successfully',
                'lab_id' => $labId
            ]);

        } catch (Exception $e) {
            $conn->rollback();
            throw $e;
        }
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>