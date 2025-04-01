<?php
$servername = "localhost"; // Server is localhost
$username = "root";        // Default username for local MySQL (XAMPP/WAMP)
$password = "";            // Default password for local MySQL (often empty in XAMPP)
$dbname = "sysarch";       // Your database name

// Create connection
$conn = new mysqli($servername, $username, $password, $dbname);

// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}
echo "Connected successfully";
?>
