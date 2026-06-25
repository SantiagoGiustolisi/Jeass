<?php
// ============================================================
//  JEASS · Endpoint catálogo
//  GET  → devuelve el catálogo completo como JSON
//  POST → recibe el catálogo completo y reemplaza todo en BD
// ============================================================
require_once __DIR__ . '/config.php';

$pdo    = getDB();
$method = $_SERVER['REQUEST_METHOD'];

// ── GET ─────────────────────────────────────────────────────
if ($method === 'GET') {
    $catalog = [];

    $brands = $pdo->query(
        "SELECT * FROM brands ORDER BY display_order, id"
    )->fetchAll();

    foreach ($brands as $brand) {
        $key = $brand['brand_key'];
        $catalog[$key] = [
            'name'       => $brand['name'],
            'cls'        => $brand['cls'],
            'img'        => $brand['img'],
            'sub'        => $brand['sub'],
            'categories' => [],
        ];

        $stmtCat = $pdo->prepare(
            "SELECT * FROM categories WHERE brand_id = ? ORDER BY display_order, id"
        );
        $stmtCat->execute([$brand['id']]);

        foreach ($stmtCat->fetchAll() as $cat) {
            $catData = [
                'name'     => $cat['name'],
                'icon'     => $cat['icon'],
                'coverImg' => $cat['cover_img'],
                'products' => [],
            ];

            $stmtProd = $pdo->prepare(
                "SELECT * FROM products WHERE category_id = ? ORDER BY display_order, id"
            );
            $stmtProd->execute([$cat['id']]);

            foreach ($stmtProd->fetchAll() as $prod) {
                $catData['products'][] = [
                    'name'      => $prod['name'],
                    'price'     => (float) $prod['price'],
                    'sizes'     => json_decode($prod['sizes']      ?? '[]', true) ?: [],
                    'qtyBySize' => (object)(json_decode($prod['qty_by_size'] ?? '{}', true) ?: []),
                    'qty'       => (int) $prod['qty'],
                    'stock'     => (bool) $prod['in_stock'],
                    'img'       => $prod['img'],
                    'g'         => [$prod['gradient_start'], $prod['gradient_end']],
                ];
            }

            $catalog[$key]['categories'][] = $catData;
        }
    }

    echo json_encode($catalog, JSON_UNESCAPED_UNICODE);
    exit;
}

// ── POST ────────────────────────────────────────────────────
if ($method === 'POST') {
    $catalog = json_decode(file_get_contents('php://input'), true);

    if (!is_array($catalog)) {
        http_response_code(400);
        echo json_encode(['error' => 'JSON inválido']);
        exit;
    }

    $pdo->beginTransaction();
    try {
        // Borra todo; el CASCADE elimina categorías y productos
        $pdo->exec("DELETE FROM brands");

        $brandOrder = 0;
        foreach ($catalog as $brandKey => $b) {
            $stmt = $pdo->prepare(
                "INSERT INTO brands (brand_key, name, cls, img, sub, display_order)
                 VALUES (?, ?, ?, ?, ?, ?)"
            );
            $stmt->execute([
                $brandKey,
                $b['name'] ?? '',
                $b['cls']  ?? '',
                $b['img']  ?? '',
                $b['sub']  ?? '',
                $brandOrder++,
            ]);
            $brandId = (int) $pdo->lastInsertId();

            $catOrder = 0;
            foreach ($b['categories'] ?? [] as $cat) {
                $stmt = $pdo->prepare(
                    "INSERT INTO categories (brand_id, name, icon, cover_img, display_order)
                     VALUES (?, ?, ?, ?, ?)"
                );
                $stmt->execute([
                    $brandId,
                    $cat['name']     ?? '',
                    $cat['icon']     ?? '',
                    $cat['coverImg'] ?? '',
                    $catOrder++,
                ]);
                $catId = (int) $pdo->lastInsertId();

                $prodOrder = 0;
                foreach ($cat['products'] ?? [] as $prod) {
                    $g = $prod['g'] ?? ['#151520', '#080810'];
                    $stmt = $pdo->prepare(
                        "INSERT INTO products
                           (category_id, name, price, sizes, qty_by_size, qty,
                            in_stock, img, gradient_start, gradient_end, display_order)
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
                    );
                    $stmt->execute([
                        $catId,
                        $prod['name']           ?? '',
                        $prod['price']          ?? 0,
                        json_encode($prod['sizes']     ?? [],          JSON_UNESCAPED_UNICODE),
                        json_encode($prod['qtyBySize'] ?? new stdClass(), JSON_UNESCAPED_UNICODE),
                        $prod['qty']            ?? 0,
                        ($prod['stock'] ?? false) ? 1 : 0,
                        $prod['img']            ?? '',
                        $g[0] ?? '#151520',
                        $g[1] ?? '#080810',
                        $prodOrder++,
                    ]);
                }
            }
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
