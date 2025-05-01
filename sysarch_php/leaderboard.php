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
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        // Query to fetch all students with their points and session counts
        $query = "
            SELECT 
                u.idno,
                u.firstname,
                u.lastname,
                u.course,
                u.level,
                u.points,
                u.session,
                COUNT(sr.reward_id) AS total_rewards
            FROM 
                users u
            LEFT JOIN 
                sitin_rewards sr ON u.idno = sr.idno
            WHERE 
                u.role = 'student'
            GROUP BY 
                u.idno
            ORDER BY 
                u.points DESC, u.session DESC
        ";

        $stmt = $conn->prepare($query);
        $stmt->execute();
        $result = $stmt->get_result();

        $students = [];
        while ($row = $result->fetch_assoc()) {
            $students[] = [
                'idno' => $row['idno'],
                'firstname' => $row['firstname'],
                'lastname' => $row['lastname'],
                'course' => $row['course'],
                'level' => $row['level'],
                'points' => $row['points'],
                'session' => $row['session'],
                'total_rewards' => $row['total_rewards']
            ];
        }

        echo json_encode([
            'success' => true,
            'data' => $students
        ]);

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