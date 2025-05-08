<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Include database connection
require_once 'connection.php';

// Initialize response array
$response = [
    'success' => false,
    'error' => '',
    'data' => []
];

// Handle PUT request - Update computer status
if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    // Get request body
    $data = json_decode(file_get_contents('php://input'), true);
    
    // Validate required fields
    if (!isset($data['computer_id']) || !isset($data['status'])) {
        $response['error'] = 'Missing computer_id or status';
        echo json_encode($response);
        exit();
    }
    
    // Validate status is one of the allowed values
    $allowed_statuses = ['available', 'in_use', 'maintenance', 'offline'];
    if (!in_array($data['status'], $allowed_statuses)) {
        $response['error'] = 'Invalid status value';
        echo json_encode($response);
        exit();
    }
    
    try {
        // Update computer status
        $stmt = $conn->prepare("
            UPDATE computers 
            SET status = ?, notes = ? 
            WHERE computer_id = ?
        ");
        
        $notes = isset($data['notes']) ? $data['notes'] : null;
        $stmt->bind_param("ssi", $data['status'], $notes, $data['computer_id']);
        
        if (!$stmt->execute()) {
            throw new Exception('Failed to update computer status');
        }
        
        // Check if any rows were affected
        if ($stmt->affected_rows === 0) {
            throw new Exception('Computer not found');
        }
        
        // Get the updated computer
        $stmt = $conn->prepare("
            SELECT * FROM computers 
            WHERE computer_id = ?
        ");
        $stmt->bind_param("i", $data['computer_id']);
        $stmt->execute();
        $result = $stmt->get_result();
        $computer = $result->fetch_assoc();
        
        $response['success'] = true;
        $response['data'] = $computer;
        
    } catch (Exception $e) {
        $response['error'] = $e->getMessage();
    }
    
    echo json_encode($response);
    exit();
}

// Handle GET request - Get computer by ID or all computers
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        // Check if computer_id is provided
        if (isset($_GET['computer_id'])) {
            // Get specific computer
            $stmt = $conn->prepare("
                SELECT c.*, l.lab_name
                FROM computers c
                JOIN labs l ON c.lab_id = l.lab_id
                WHERE c.computer_id = ?
            ");
            $stmt->bind_param("i", $_GET['computer_id']);
            $stmt->execute();
            $result = $stmt->get_result();
            
            if ($result->num_rows === 0) {
                throw new Exception('Computer not found');
            }
            
            $computer = $result->fetch_assoc();
            $response['data'] = $computer;
        } else {
            // Get all computers with optional lab_id filter
            $query = "
                SELECT c.*, l.lab_name
                FROM computers c
                JOIN labs l ON c.lab_id = l.lab_id
                WHERE 1=1
            ";
            $params = [];
            $types = "";
            
            if (isset($_GET['lab_id'])) {
                $query .= " AND c.lab_id = ?";
                $params[] = $_GET['lab_id'];
                $types .= "i";
            }
            
            if (isset($_GET['status'])) {
                $query .= " AND c.status = ?";
                $params[] = $_GET['status'];
                $types .= "s";
            }
            
            $query .= " ORDER BY c.lab_id, c.computer_name";
            
            $stmt = $conn->prepare($query);
            
            if (count($params) > 0) {
                $stmt->bind_param($types, ...$params);
            }
            
            $stmt->execute();
            $result = $stmt->get_result();
            
            $computers = [];
            while ($row = $result->fetch_assoc()) {
                $computers[] = $row;
            }
            
            $response['data'] = $computers;
        }
        
        $response['success'] = true;
        
    } catch (Exception $e) {
        $response['error'] = $e->getMessage();
    }
    
    echo json_encode($response);
    exit();
}

// If we reach here, the request method is not supported
$response['error'] = 'Unsupported request method';
echo json_encode($response);
exit();
?>