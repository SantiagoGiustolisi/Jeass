<?php
// ============================================================
//  JEASS · Endpoint drops
//  GET  → devuelve el array de drops como JSON
//  POST → recibe el array completo y reemplaza todo en BD
// ============================================================
require_once __DIR__ . '/config.php';

$pdo    = getDB();
$method = $_SERVER['REQUEST_METHOD'];

// ── GET ─────────────────────────────────────────────────────
if ($method === 'GET') {
    $rows = $pdo->query(
        "SELECT * FROM drops ORDER BY display_order, id"
    )->fetchAll();

    $result = array_map(fn($d) => [
        'name'   => $d['name'],
        'sub'    => $d['sub'],
        'date'   => $d['drop_date'],
        'status' => $d['status'],
    ], $rows);

    echo json_encode($result, JSON_UNESCAPED_UNICODE);
    exit;
}

// ── POST ────────────────────────────────────────────────────
if ($method === 'POST') {
    $drops = json_decode(file_get_contents('php://input'), true);

    if (!is_array($drops)) {
        http_response_code(400);
        echo json_encode(['error' => 'JSON inválido']);
        exit;
    }

    $pdo->beginTransaction();
    try {
        $pdo->exec("DELETE FROM drops");

        $order = 0;
        foreach ($drops as $drop) {
            $stmt = $pdo->prepare(
                "INSERT INTO drops (name, sub, drop_date, status, display_order)
                 VALUES (?, ?, ?, ?, ?)"
            );
            $stmt->execute([
                $drop['name']   ?? '',
                $drop['sub']    ?? '',
                $drop['date']   ?: null,
                $drop['status'] ?? 'soon',
                $order++,
            ]);
        }

        $pdo->commit();
        echo json_encode(['success' => true]);

    } catch (Exception $e) {
        $pdo->rollBack();
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Método no permitido']);
