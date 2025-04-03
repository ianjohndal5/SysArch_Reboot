<?php
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

require 'connection.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Get all announcements
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $filter = isset($_GET['filter']) ? $_GET['filter'] : 'all';
        
        $query = "SELECT a.*, IFNULL(u.username, 'System') as author_name 
                  FROM announcements a
                  LEFT JOIN users u ON a.author_id = u.idno";
        
        if ($filter !== 'all') {
            $query .= " WHERE a.target = ?";
        }
        
        $query .= " ORDER BY a.created_at DESC";
        
        $stmt = $conn->prepare($query);
        
        if ($filter !== 'all') {
            $stmt->bind_param("s", $filter);
        }
        
        $stmt->execute();
        $result = $stmt->get_result();
        $announcements = [];
        
        while ($row = $result->fetch_assoc()) {
            // Get like count for each announcement
            $likeStmt = $conn->prepare("SELECT COUNT(*) as like_count FROM announcement_likes WHERE announcement_id = ?");
            $likeStmt->bind_param("i", $row['id']);
            $likeStmt->execute();
            $likeResult = $likeStmt->get_result();
            $row['likes'] = $likeResult->fetch_assoc()['like_count'];
            $likeStmt->close();
            
            // Get comment count for each announcement
            $commentStmt = $conn->prepare("SELECT COUNT(*) as comment_count FROM announcement_comments WHERE announcement_id = ?");
            $commentStmt->bind_param("i", $row['id']);
            $commentStmt->execute();
            $commentResult = $commentStmt->get_result();
            $row['comments'] = $commentResult->fetch_assoc()['comment_count'];
            $commentStmt->close();
            
            $announcements[] = $row;
        }
        
        echo json_encode([
            'success' => true,
            'announcements' => $announcements
        ]);
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error' => $e->getMessage()
        ]);
    }
}

// Create new announcement
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        $json = file_get_contents('php://input');
        $data = json_decode($json, true);
        
        // Validate required fields
        $required = ['title', 'content'];
        foreach ($required as $field) {
            if (empty($data[$field])) {
                throw new Exception("Missing required field: $field");
            }
        }

        $target = $data['target'] ?? 'all';
        $authorId = isset($data['author_id']) ? $data['author_id'] : NULL;
        
        $stmt = $conn->prepare("
            INSERT INTO announcements (author_id, title, content, target)
            VALUES (?, ?, ?, ?)
        ");
        $stmt->bind_param("isss", $authorId, $data['title'], $data['content'], $target);
        
        if (!$stmt->execute()) {
            throw new Exception("Failed to create announcement: " . $conn->error);
        }
        
        // Get the newly created announcement
        $announcementId = $conn->insert_id;
        $getStmt = $conn->prepare("
            SELECT a.*, IFNULL(u.username, 'System') as author_name 
            FROM announcements a
            LEFT JOIN users u ON a.author_id = u.idno
            WHERE a.id = ?
        ");
        $getStmt->bind_param("i", $announcementId);
        $getStmt->execute();
        $result = $getStmt->get_result();
        $announcement = $result->fetch_assoc();
        
        // Initialize likes and comments count
        $announcement['likes'] = 0;
        $announcement['comments'] = 0;
        
        echo json_encode([
            'success' => true,
            'announcement' => $announcement
        ]);
        
    } catch (Exception $e) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'error' => $e->getMessage()
        ]);
    }
}

// Like/unlike announcement
if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    try {
        $json = file_get_contents('php://input');
        $data = json_decode($json, true);
        
        if (empty($data['announcement_id']) || empty($data['user_id'])) {
            throw new Exception("Missing required fields");
        }
        
        // Check if like already exists
        $checkStmt = $conn->prepare("
            SELECT id FROM announcement_likes 
            WHERE announcement_id = ? AND user_id = ?
        ");
        $checkStmt->bind_param("ii", $data['announcement_id'], $data['user_id']);
        $checkStmt->execute();
        $checkResult = $checkStmt->get_result();
        
        if ($checkResult->num_rows > 0) {
            // Unlike
            $deleteStmt = $conn->prepare("
                DELETE FROM announcement_likes 
                WHERE announcement_id = ? AND user_id = ?
            ");
            $deleteStmt->bind_param("ii", $data['announcement_id'], $data['user_id']);
            $deleteStmt->execute();
            $action = 'unliked';
        } else {
            // Like
            $insertStmt = $conn->prepare("
                INSERT INTO announcement_likes (announcement_id, user_id)
                VALUES (?, ?)
            ");
            $insertStmt->bind_param("ii", $data['announcement_id'], $data['user_id']);
            $insertStmt->execute();
            $action = 'liked';
        }
        
        // Get updated like count
        $countStmt = $conn->prepare("
            SELECT COUNT(*) as like_count 
            FROM announcement_likes 
            WHERE announcement_id = ?
        ");
        $countStmt->bind_param("i", $data['announcement_id']);
        $countStmt->execute();
        $countResult = $countStmt->get_result();
        $likeCount = $countResult->fetch_assoc()['like_count'];
        
        echo json_encode([
            'success' => true,
            'action' => $action,
            'likeCount' => $likeCount
        ]);
        
    } catch (Exception $e) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'error' => $e->getMessage()
        ]);
    }
}

// Update announcement
if ($_SERVER['REQUEST_METHOD'] === 'PATCH') {
    try {
        $json = file_get_contents('php://input');
        $data = json_decode($json, true);
        
        if (empty($data['id']) || empty($data['title']) || empty($data['content'])) {
            throw new Exception("Missing required fields");
        }
        
        $stmt = $conn->prepare("
            UPDATE announcements 
            SET title = ?, content = ?, target = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        ");
        $stmt->bind_param("sssi", $data['title'], $data['content'], $data['target'], $data['id']);
        
        if (!$stmt->execute()) {
            throw new Exception("Failed to update announcement: " . $conn->error);
        }
        
        // Get the updated announcement
        $getStmt = $conn->prepare("
            SELECT a.*, IFNULL(u.username, 'System') as author_name 
            FROM announcements a
            LEFT JOIN users u ON a.author_id = u.idno
            WHERE a.id = ?
        ");
        $getStmt->bind_param("i", $data['id']);
        $getStmt->execute();
        $result = $getStmt->get_result();
        $announcement = $result->fetch_assoc();
        
        // Get counts
        $likeStmt = $conn->prepare("SELECT COUNT(*) as like_count FROM announcement_likes WHERE announcement_id = ?");
        $likeStmt->bind_param("i", $data['id']);
        $likeStmt->execute();
        $likeResult = $likeStmt->get_result();
        $announcement['likes'] = $likeResult->fetch_assoc()['like_count'];
        $likeStmt->close();
        
        $commentStmt = $conn->prepare("SELECT COUNT(*) as comment_count FROM announcement_comments WHERE announcement_id = ?");
        $commentStmt->bind_param("i", $data['id']);
        $commentStmt->execute();
        $commentResult = $commentStmt->get_result();
        $announcement['comments'] = $commentResult->fetch_assoc()['comment_count'];
        $commentStmt->close();
        
        echo json_encode([
            'success' => true,
            'announcement' => $announcement
        ]);
        
    } catch (Exception $e) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'error' => $e->getMessage()
        ]);
    }
}

// Delete announcement
if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    try {
        $json = file_get_contents('php://input');
        $data = json_decode($json, true);
        
        if (empty($data['id'])) {
            throw new Exception("Missing announcement ID");
        }
        
        // Start transaction to ensure all deletes succeed or fail together
        $conn->begin_transaction();
        
        try {
            // First delete likes (due to foreign key constraints)
            $deleteLikes = $conn->prepare("DELETE FROM announcement_likes WHERE announcement_id = ?");
            $deleteLikes->bind_param("i", $data['id']);
            $deleteLikes->execute();
            
            // Then delete comments
            $deleteComments = $conn->prepare("DELETE FROM announcement_comments WHERE announcement_id = ?");
            $deleteComments->bind_param("i", $data['id']);
            $deleteComments->execute();
            
            // Finally delete the announcement
            $deleteAnnouncement = $conn->prepare("DELETE FROM announcements WHERE id = ?");
            $deleteAnnouncement->bind_param("i", $data['id']);
            $deleteAnnouncement->execute();
            
            // Commit the transaction if all queries succeeded
            $conn->commit();
            
            echo json_encode([
                'success' => true,
                'id' => $data['id']
            ]);
        } catch (Exception $e) {
            // Roll back if any query failed
            $conn->rollback();
            throw $e;
        }
        
    } catch (Exception $e) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'error' => $e->getMessage()
        ]);
    }
}
?>