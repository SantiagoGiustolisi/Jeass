<?php
// ============================================================
//  JEASS · Configuración de base de datos
//  Completar con los datos de Hostinger:
//  Panel Hostinger → Bases de datos → MySQL
// ============================================================

define('DB_HOST',    'localhost');
define('DB_NAME',    'u000000_jeass');   // <-- cambiar
define('DB_USER',    'u000000_jeass');   // <-- cambiar
define('DB_PASS',    'tu_password');     // <-- cambiar
define('DB_CHARSET', 'utf8mb4');

function getDB(): PDO {
    static $pdo = null;
    if ($pdo === null) {
        $dsn = sprintf(
            'mysql:host=%s;dbname=%s;charset=%s',
            DB_HOST, DB_NAME, DB_CHARSET
        );
        try {
            $pdo = new PDO($dsn, DB_USER, DB_PASS, [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
            ]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'No se pudo conectar a la base de datos']);
            exit;
        }
    }
    return $pdo;
}

// Cabeceras comunes para todos los endpoints
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}
