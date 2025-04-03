<?php
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "sysarch";

// Create connection
$conn = new mysqli($servername, $username, $password, $dbname);

// Check connection
if ($conn->connect_error) {
    // Return JSON error instead of plain text
    header("Content-Type: application/json");
    die(json_encode([
        'success' => false,
        'error' => 'Database connection failed: ' . $conn->connect_error
    ]));
}

// Don't output any success message - just set charset
$conn->set_charset("utf8mb4");
?>