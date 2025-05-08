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

// Helper function to generate default computers for a lab
function generateDefaultComputers($lab_id, $count = 50) {
    global $conn;
    
    // Check how many computers already exist for this lab
    $stmt = $conn->prepare("SELECT COUNT(*) AS existing_count FROM computers WHERE lab_id = ?");
    $stmt->bind_param("i", $lab_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $existing_count = $result->fetch_assoc()['existing_count'];
    
    // Calculate how many computers we need to create
    $to_create = max(0, $count - $existing_count);
    
    if ($to_create > 0) {
        // Start transaction
        $conn->begin_transaction();
        
        try {
            // Prepare statement for creating computers
            $stmt = $conn->prepare("INSERT INTO computers (lab_id, computer_name, status) VALUES (?, ?, 'available')");
            
            // Create computers
            for ($i = $existing_count + 1; $i <= $count; $i++) {
                $computer_name = "PC-" . str_pad($i, 2, '0', STR_PAD_LEFT);
                $stmt->bind_param("is", $lab_id, $computer_name);
                $stmt->execute();
            }
            
            // Commit transaction
            $conn->commit();
            
            return true;
        } catch (Exception $e) {
            // Rollback on error
            $conn->rollback();
            return false;
        }
    }
    
    return true;
}

// Validate JWT token
function validateToken() {
    if (!isset($_SERVER['HTTP_AUTHORIZATION'])) {
        return false;
    }
    
    $auth_header = $_SERVER['HTTP_AUTHORIZATION'];
    $token = null;
    
    // Extract the token from the Authorization header
    if (preg_match('/Bearer\s(\S+)/', $auth_header, $matches)) {
        $token = $matches[1];
    }
    
    if (!$token) {
        return false;
    }
    
    // Here you would validate the JWT token
    // For simplicity, we'll assume the token is valid
    return true;
}

// Handle GET request - Fetch computers for a specific lab
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (isset($_GET['lab_id']) && is_numeric($_GET['lab_id'])) {
        $lab_id = intval($_GET['lab_id']);
        
        // Validate that the lab exists
        $stmt = $conn->prepare("SELECT * FROM labs WHERE lab_id = ?");
        $stmt->bind_param("i", $lab_id);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows === 0) {
            $response['error'] = 'Lab not found';
            echo json_encode($response);
            exit();
        }
        
        // Generate default computers if needed
        if (!generateDefaultComputers($lab_id)) {
            $response['error'] = 'Failed to generate default computers';
            echo json_encode($response);
            exit();
        }
        
        // Get computers for this lab
        $stmt = $conn->prepare("SELECT * FROM computers WHERE lab_id = ? ORDER BY computer_name");
        $stmt->bind_param("i", $lab_id);
        $stmt->execute();
        $result = $stmt->get_result();
        
        $computers = [];
        while ($row = $result->fetch_assoc()) {
            $computers[] = $row;
        }
        
        $response['success'] = true;
        $response['data'] = $computers;
    } else {
        $response['error'] = 'Invalid lab ID';
    }
    
    echo json_encode($response);
    exit();
}

// Handle PUT request - Update a computer's status (simplified to toggle between available/in_use)
if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    // Check if user is authenticated
    if (!validateToken()) {
        http_response_code(401);
        $response['error'] = 'Unauthorized';
        echo json_encode($response);
        exit();
    }
    
    // Get request body
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($data['computer_id']) || !is_numeric($data['computer_id'])) {
        $response['error'] = 'Missing computer ID';
        echo json_encode($response);
        exit();
    }
    
    $computer_id = intval($data['computer_id']);
    
    // Check if computer exists
    $stmt = $conn->prepare("SELECT * FROM computers WHERE computer_id = ?");
    $stmt->bind_param("i", $computer_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        $response['error'] = 'Computer not found';
        echo json_encode($response);
        exit();
    }
    
    // Set status based on input (or default to available)
    $status = isset($data['status']) ? $data['status'] : 'available';
    
    // Simplify statuses to just available and in_use
    if ($status !== 'available' && $status !== 'in_use') {
        $status = 'available';
    }
    
    // Update the computer status
    $stmt = $conn->prepare("UPDATE computers SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE computer_id = ?");
    $stmt->bind_param("si", $status, $computer_id);
    
    if ($stmt->execute()) {
        // Get updated computer
        $stmt = $conn->prepare("SELECT * FROM computers WHERE computer_id = ?");
        $stmt->bind_param("i", $computer_id);
        $stmt->execute();
        $result = $stmt->get_result();
        $computer = $result->fetch_assoc();
        
        $response['success'] = true;
        $response['data'] = $computer;
    } else {
        $response['error'] = 'Failed to update computer';
    }
    
    echo json_encode($response);
    exit();
}

// If we reach here, the request method is not supported
$response['error'] = 'Method not allowed';
echo json_encode($response);
?>