<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
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

// Handle GET request to fetch lab schedules
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Validate required parameters
    if (!isset($_GET['lab_id']) || empty($_GET['lab_id'])) {
        $response['error'] = 'Missing lab_id parameter';
        echo json_encode($response);
        exit();
    }
    
    $lab_id = $_GET['lab_id'];
    
    // Get day_of_week parameter if provided, otherwise use the current day
    if (isset($_GET['date']) && !empty($_GET['date'])) {
        $date = $_GET['date'];
        $day_of_week = date('l', strtotime($date)); // Convert date to day of week (Monday, Tuesday, etc.)
    } else {
        $day_of_week = date('l'); // Use current day of week
    }
    
    try {
        // Query to get lab schedules for the specified lab and day
        $stmt = $conn->prepare("
            SELECT * FROM lab_schedules
            WHERE lab_id = ? AND day_of_week = ? AND is_available = 1
            ORDER BY start_time
        ");
        
        $stmt->bind_param("is", $lab_id, $day_of_week);
        $stmt->execute();
        $result = $stmt->get_result();
        
        $schedules = [];
        while ($row = $result->fetch_assoc()) {
            $schedules[] = [
                'schedule_id' => $row['schedule_id'],
                'day_of_week' => $row['day_of_week'],
                'start_time' => $row['start_time'],
                'end_time' => $row['end_time'],
                'is_available' => (bool)$row['is_available']
            ];
        }
        
        // Get existing reservations for the specified lab and date (if date provided)
        $reservations = [];
        if (isset($_GET['date']) && !empty($_GET['date'])) {
            $stmt = $conn->prepare("
                SELECT r.*, c.computer_name
                FROM reservations r
                JOIN computers c ON r.computer_id = c.computer_id
                WHERE r.lab_id = ? 
                AND r.reservation_date = ?
                AND r.status IN ('pending', 'approved')
                ORDER BY r.time_in
            ");
            
            $stmt->bind_param("is", $lab_id, $_GET['date']);
            $stmt->execute();
            $result = $stmt->get_result();
            
            while ($row = $result->fetch_assoc()) {
                // Calculate time_out by adding duration to time_in
                $time_in = $row['time_in'];
                $duration = $row['duration'];
                $time_out = date('H:i:s', strtotime($time_in . ' + ' . $duration . ' hours'));
                
                $reservations[] = [
                    'reservation_id' => $row['reservation_id'],
                    'computer_id' => $row['computer_id'],
                    'computer_name' => $row['computer_name'],
                    'time_in' => $time_in,
                    'time_out' => $time_out,
                    'duration' => $duration,
                    'status' => $row['status']
                ];
            }
        }
        
        $response['success'] = true;
        $response['data'] = [
            'lab_id' => $lab_id,
            'day_of_week' => $day_of_week,
            'schedules' => $schedules,
            'reservations' => $reservations
        ];
        
    } catch (Exception $e) {
        $response['error'] = 'Database error: ' . $e->getMessage();
    }
    
    echo json_encode($response);
    exit();
}

// If we reach here, the request method is not supported
$response['error'] = 'Unsupported request method';
echo json_encode($response);
exit();
?>