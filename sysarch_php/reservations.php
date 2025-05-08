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

// Create reservations table if it doesn't exist
function createReservationsTableIfNotExists() {
    global $conn;
    
    $sql = "CREATE TABLE IF NOT EXISTS `reservations` (
        `reservation_id` int(11) NOT NULL AUTO_INCREMENT,
        `idno` int(11) NOT NULL,
        `lab_id` int(11) NOT NULL,
        `computer_id` int(11) NOT NULL,
        `purpose` text NOT NULL,
        `reservation_date` date NOT NULL,
        `time_in` time NOT NULL,
        `duration` int(11) NOT NULL DEFAULT 1,
        `status` enum('pending','approved','rejected','completed','cancelled') NOT NULL DEFAULT 'pending',
        `admin_notes` text,
        `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (`reservation_id`),
        KEY `idno` (`idno`),
        KEY `lab_id` (`lab_id`),
        KEY `computer_id` (`computer_id`),
        CONSTRAINT `reservations_ibfk_1` FOREIGN KEY (`idno`) REFERENCES `users` (`idno`),
        CONSTRAINT `reservations_ibfk_2` FOREIGN KEY (`lab_id`) REFERENCES `labs` (`lab_id`),
        CONSTRAINT `reservations_ibfk_3` FOREIGN KEY (`computer_id`) REFERENCES `computers` (`computer_id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";
    
    if (!$conn->query($sql)) {
        error_log("Error creating reservations table: " . $conn->error);
        return false;
    }
    
    return true;
}

// Check if the requested time is within lab schedule
function validateLabSchedule($lab_id, $reservation_date, $time_in, $duration) {
    global $conn;
    
    // Get day of week from reservation date
    $day_of_week = date('l', strtotime($reservation_date));
    
    // Parse time_in and calculate time_out
    $time_in_obj = new DateTime($time_in);
    $time_out_obj = clone $time_in_obj;
    $time_out_obj->add(new DateInterval("PT{$duration}H"));
    $time_out = $time_out_obj->format('H:i:s');
    
    // Check if there is a lab schedule that covers the entire reservation period
    $stmt = $conn->prepare("
        SELECT * FROM lab_schedules 
        WHERE lab_id = ? 
        AND day_of_week = ? 
        AND start_time <= ? 
        AND end_time >= ? 
        AND is_available = 1
    ");
    
    $stmt->bind_param("isss", $lab_id, $day_of_week, $time_in, $time_out);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        return [false, "The lab is not available at the selected time or the reservation extends beyond lab operating hours"];
    }
    
    return [true, "The requested time is within lab schedule"];
}

// Validate if a computer is available for the requested time
function validateComputerAvailability($computer_id, $reservation_date, $time_in, $duration) {
    global $conn;
    
    // Check if the computer exists and is available
    $stmt = $conn->prepare("SELECT * FROM computers WHERE computer_id = ?");
    $stmt->bind_param("i", $computer_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        return [false, 'Computer not found'];
    }
    
    $computer = $result->fetch_assoc();
    if ($computer['status'] !== 'available') {
        return [false, 'Computer is not available'];
    }
    
    // Convert duration to hours
    $duration_hours = intval($duration);
    
    // Calculate time_out by adding duration to time_in
    $time_in_obj = new DateTime($time_in);
    $time_out_obj = clone $time_in_obj;
    $time_out_obj->add(new DateInterval("PT{$duration_hours}H"));
    $time_out = $time_out_obj->format('H:i:s');
    
    // Check if there are any overlapping reservations
    $stmt = $conn->prepare("
        SELECT * FROM reservations 
        WHERE computer_id = ? 
        AND reservation_date = ? 
        AND status IN ('pending', 'approved')
        AND (
            (time_in <= ? AND ADDTIME(time_in, SEC_TO_TIME(duration * 3600)) > ?) OR
            (time_in < ADDTIME(?, SEC_TO_TIME(? * 3600)) AND time_in >= ?)
        )
    ");
    
    $stmt->bind_param("issssis", 
        $computer_id, 
        $reservation_date, 
        $time_out, 
        $time_in,
        $time_in,
        $duration_hours,
        $time_in
    );
    
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows > 0) {
        return [false, 'Computer is already reserved for this time period'];
    }
    
    return [true, 'Computer is available'];
}

// Handle GET request - Fetch reservations with filters
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Create table if it doesn't exist
    if (!createReservationsTableIfNotExists()) {
        $response['error'] = 'Failed to create reservations table';
        echo json_encode($response);
        exit();
    }
    
    // Prepare base query
    $query = "SELECT r.*, u.firstname, u.lastname, u.course, u.level, l.lab_name, c.computer_name 
              FROM reservations r
              JOIN users u ON r.idno = u.idno
              JOIN labs l ON r.lab_id = l.lab_id
              JOIN computers c ON r.computer_id = c.computer_id
              WHERE 1=1";
    $params = [];
    $types = "";
    
    // Apply filters
    if (isset($_GET['idno']) && !empty($_GET['idno'])) {
        $query .= " AND r.idno = ?";
        $params[] = $_GET['idno'];
        $types .= "i";
    }
    
    if (isset($_GET['status']) && !empty($_GET['status'])) {
        $query .= " AND r.status = ?";
        $params[] = $_GET['status'];
        $types .= "s";
    }
    
    if (isset($_GET['lab_id']) && !empty($_GET['lab_id'])) {
        $query .= " AND r.lab_id = ?";
        $params[] = $_GET['lab_id'];
        $types .= "i";
    }
    
    if (isset($_GET['date']) && !empty($_GET['date'])) {
        $query .= " AND r.reservation_date = ?";
        $params[] = $_GET['date'];
        $types .= "s";
    }
    
    if (isset($_GET['reservation_id']) && !empty($_GET['reservation_id'])) {
        $query .= " AND r.reservation_id = ?";
        $params[] = $_GET['reservation_id'];
        $types .= "i";
    }
    
    // Order by created_at descending (newest first)
    $query .= " ORDER BY r.created_at DESC";
    
    // Execute the query
    $stmt = $conn->prepare($query);
    
    if (!empty($params)) {
        $stmt->bind_param($types, ...$params);
    }
    
    $stmt->execute();
    $result = $stmt->get_result();
    
    // Fetch all reservations
    $reservations = [];
    while ($row = $result->fetch_assoc()) {
        $reservations[] = $row;
    }
    
    $response['success'] = true;
    $response['data'] = $reservations;
    
    echo json_encode($response);
    exit();
}

// Handle POST request - Create a new reservation
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Create table if it doesn't exist
    if (!createReservationsTableIfNotExists()) {
        $response['error'] = 'Failed to create reservations table';
        echo json_encode($response);
        exit();
    }
    
    // Get request body
    $data = json_decode(file_get_contents('php://input'), true);
    
    // Validate required fields
    $required_fields = ['idno', 'lab_id', 'computer_id', 'purpose', 'date', 'time_in', 'duration'];
    foreach ($required_fields as $field) {
        if (!isset($data[$field]) || empty($data[$field])) {
            $response['error'] = "Missing required field: $field";
            echo json_encode($response);
            exit();
        }
    }
    
    // Validate student ID exists and has sessions available
    $stmt = $conn->prepare("SELECT * FROM users WHERE idno = ?");
    $stmt->bind_param("i", $data['idno']);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        $response['error'] = 'Student ID not found';
        echo json_encode($response);
        exit();
    }
    
    $user = $result->fetch_assoc();
    if ($user['session'] <= 0) {
        $response['error'] = 'No available sessions';
        echo json_encode($response);
        exit();
    }
    
    // Validate that the reservation time is within lab schedule
    list($is_within_schedule, $schedule_message) = validateLabSchedule(
        $data['lab_id'],
        $data['date'],
        $data['time_in'],
        $data['duration']
    );
    
    if (!$is_within_schedule) {
        $response['error'] = $schedule_message;
        echo json_encode($response);
        exit();
    }
    
    // Validate computer availability
    list($is_available, $availability_message) = validateComputerAvailability(
        $data['computer_id'],
        $data['date'],
        $data['time_in'],
        $data['duration']
    );
    
    if (!$is_available) {
        $response['error'] = $availability_message;
        echo json_encode($response);
        exit();
    }
    
    // Set default status if not provided
    $status = isset($data['status']) ? $data['status'] : 'pending';
    
    // Begin transaction
    $conn->begin_transaction();
    
    try {
        // Insert reservation
        $stmt = $conn->prepare("
            INSERT INTO reservations 
            (idno, lab_id, computer_id, purpose, reservation_date, time_in, duration, status) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ");
        
        $stmt->bind_param("iiisssis", 
            $data['idno'],
            $data['lab_id'],
            $data['computer_id'],
            $data['purpose'],
            $data['date'],
            $data['time_in'],
            $data['duration'],
            $status
        );
        
        if (!$stmt->execute()) {
            throw new Exception('Failed to create reservation');
        }
        
        $reservation_id = $conn->insert_id;
        
        // Commit transaction
        $conn->commit();
        
        // Get the created reservation
        $stmt = $conn->prepare("
            SELECT r.*, u.firstname, u.lastname, l.lab_name, c.computer_name 
            FROM reservations r
            JOIN users u ON r.idno = u.idno
            JOIN labs l ON r.lab_id = l.lab_id
            JOIN computers c ON r.computer_id = c.computer_id
            WHERE r.reservation_id = ?
        ");
        $stmt->bind_param("i", $reservation_id);
        $stmt->execute();
        $result = $stmt->get_result();
        $reservation = $result->fetch_assoc();
        
        $response['success'] = true;
        $response['data'] = $reservation;
        
    } catch (Exception $e) {
        // Rollback transaction on error
        $conn->rollback();
        $response['error'] = $e->getMessage();
    }
    
    echo json_encode($response);
    exit();
}

// Handle PUT request - Update reservation status (approve/reject)
if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    // Get request body
    $data = json_decode(file_get_contents('php://input'), true);
    
    // Validate required fields
    if (!isset($data['reservation_id']) || !isset($data['status'])) {
        $response['error'] = 'Missing reservation_id or status';
        echo json_encode($response);
        exit();
    }
    
    // Validate status is one of the allowed values
    $allowed_statuses = ['pending', 'approved', 'rejected', 'completed', 'cancelled'];
    if (!in_array($data['status'], $allowed_statuses)) {
        $response['error'] = 'Invalid status value';
        echo json_encode($response);
        exit();
    }
    
    // Begin transaction
    $conn->begin_transaction();
    
    try {
        // Get the reservation first to check if we need to update session count
        $stmt = $conn->prepare("SELECT * FROM reservations WHERE reservation_id = ?");
        $stmt->bind_param("i", $data['reservation_id']);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows === 0) {
            throw new Exception('Reservation not found');
        }
        
        $reservation = $result->fetch_assoc();
        $old_status = $reservation['status'];
        $new_status = $data['status'];
        
        // Update reservation status
        $stmt = $conn->prepare("
            UPDATE reservations 
            SET status = ?, admin_notes = ? 
            WHERE reservation_id = ?
        ");
        
        $admin_notes = isset($data['admin_notes']) ? $data['admin_notes'] : null;
        $stmt->bind_param("ssi", $new_status, $admin_notes, $data['reservation_id']);
        
        if (!$stmt->execute()) {
            throw new Exception('Failed to update reservation status');
        }
        
        // If status changes to 'approved' and old status is 'pending', deduct a session
        if ($new_status === 'approved' && $old_status === 'pending') {
            $stmt = $conn->prepare("
                UPDATE users 
                SET session = session - 1 
                WHERE idno = ? AND session > 0
            ");
            $stmt->bind_param("i", $reservation['idno']);
            
            if (!$stmt->execute()) {
                throw new Exception('Failed to update user session count');
            }
            
            // Check if any rows were affected
            if ($stmt->affected_rows === 0) {
                throw new Exception('User has no available sessions');
            }
        }
        
        // If status changes to 'rejected' or 'cancelled', and old status was 'approved', refund a session
        if (($new_status === 'rejected' || $new_status === 'cancelled') && $old_status === 'approved') {
            $stmt = $conn->prepare("
                UPDATE users 
                SET session = session + 1 
                WHERE idno = ?
            ");
            $stmt->bind_param("i", $reservation['idno']);
            
            if (!$stmt->execute()) {
                throw new Exception('Failed to refund user session');
            }
        }
        
        // Commit transaction
        $conn->commit();
        
        // Get the updated reservation
        $stmt = $conn->prepare("
            SELECT r.*, u.firstname, u.lastname, u.session, l.lab_name, c.computer_name 
            FROM reservations r
            JOIN users u ON r.idno = u.idno
            JOIN labs l ON r.lab_id = l.lab_id
            JOIN computers c ON r.computer_id = c.computer_id
            WHERE r.reservation_id = ?
        ");
        $stmt->bind_param("i", $data['reservation_id']);
        $stmt->execute();
        $result = $stmt->get_result();
        $updated_reservation = $result->fetch_assoc();
        
        $response['success'] = true;
        $response['data'] = $updated_reservation;
        
    } catch (Exception $e) {
        // Rollback transaction on error
        $conn->rollback();
        $response['error'] = $e->getMessage();
    }
    
    echo json_encode($response);
    exit();
}

// Handle DELETE request - Delete a reservation
if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    // Get request parameters
    $reservation_id = $_GET['reservation_id'] ?? null;
    
    if (!$reservation_id) {
        $response['error'] = 'Missing reservation_id';
        echo json_encode($response);
        exit();
    }
    
    // Begin transaction
    $conn->begin_transaction();
    
    try {
        // Get the reservation first to check if we need to refund a session
        $stmt = $conn->prepare("SELECT * FROM reservations WHERE reservation_id = ?");
        $stmt->bind_param("i", $reservation_id);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows === 0) {
            throw new Exception('Reservation not found');
        }
        
        $reservation = $result->fetch_assoc();
        
        // Delete the reservation
        $stmt = $conn->prepare("DELETE FROM reservations WHERE reservation_id = ?");
        $stmt->bind_param("i", $reservation_id);
        
        if (!$stmt->execute()) {
            throw new Exception('Failed to delete reservation');
        }
        
        // If status was 'approved', refund a session
        if ($reservation['status'] === 'approved') {
            $stmt = $conn->prepare("
                UPDATE users 
                SET session = session + 1 
                WHERE idno = ?
            ");
            $stmt->bind_param("i", $reservation['idno']);
            
            if (!$stmt->execute()) {
                throw new Exception('Failed to refund user session');
            }
        }
        
        // Commit transaction
        $conn->commit();
        
        $response['success'] = true;
        $response['data'] = ['reservation_id' => $reservation_id, 'message' => 'Reservation deleted successfully'];
        
    } catch (Exception $e) {
        // Rollback transaction on error
        $conn->rollback();
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