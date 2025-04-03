<?php
// Enable error reporting (remove in production)
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

require 'connection.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        // Verify database connection
        if ($conn->connect_error) {
            throw new Exception("Database connection failed: " . $conn->connect_error);
        }

        // Initialize all stats with 0 as default
        $stats = [
            'currentSitins' => 0,
            'totalStudents' => 0,
            'totalSitins' => 0,
            'activeStudents' => 0,
            'inactiveStudents' => 0
        ];

        // Get current sit-ins
        $query = "SELECT COUNT(*) as count FROM sitin WHERE logout_time IS NULL";
        if ($result = $conn->query($query)) {
            $stats['currentSitins'] = $result->fetch_assoc()['count'];
            $result->close();
        } else {
            throw new Exception("Error getting current sit-ins: " . $conn->error);
        }

        // Get total students
        $query = "SELECT COUNT(*) as count FROM users WHERE role = 'student'";
        if ($result = $conn->query($query)) {
            $stats['totalStudents'] = $result->fetch_assoc()['count'];
            $result->close();
        } else {
            throw new Exception("Error getting total students: " . $conn->error);
        }

        // Get total sit-ins
        $query = "SELECT COUNT(*) as count FROM sitin";
        if ($result = $conn->query($query)) {
            $stats['totalSitins'] = $result->fetch_assoc()['count'];
            $result->close();
        } else {
            throw new Exception("Error getting total sit-ins: " . $conn->error);
        }

        // Get active students
        $query = "SELECT COUNT(DISTINCT s.idno) as count 
                 FROM sitin s 
                 JOIN users u ON s.idno = u.idno 
                 WHERE s.logout_time IS NULL 
                 AND u.role = 'student'";
        if ($result = $conn->query($query)) {
            $stats['activeStudents'] = $result->fetch_assoc()['count'];
            $stats['inactiveStudents'] = $stats['totalStudents'] - $stats['activeStudents'];
            $result->close();
        } else {
            throw new Exception("Error getting active students: " . $conn->error);
        }

        // Weekly data - simplified to avoid potential day ordering issues
        $weeklyData = array_fill(0, 7, 0);
        $query = "SELECT 
                    DAYOFWEEK(login_time) as day_num, 
                    COUNT(*) as count 
                  FROM sitin 
                  WHERE login_time >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) 
                  GROUP BY DAYOFWEEK(login_time)";
        
        if ($result = $conn->query($query)) {
            while ($row = $result->fetch_assoc()) {
                // DAYOFWEEK returns 1=Sunday to 7=Saturday
                // We'll adjust to make Monday first (index 0)
                $adjustedIndex = ($row['day_num'] + 5) % 7;
                $weeklyData[$adjustedIndex] = (int)$row['count'];
            }
            $result->close();
        }

        echo json_encode([
            'success' => true,
            'stats' => $stats,
            'weeklyData' => $weeklyData,
            'days' => ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
        ]);

    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error' => $e->getMessage(),
            'trace' => $e->getTrace() // Remove in production
        ]);
    } finally {
        $conn->close();
    }
} else {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'error' => 'Only GET requests are allowed'
    ]);
}
?>