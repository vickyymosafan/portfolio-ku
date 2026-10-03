<?php
declare(strict_types=1);

/*
 * Portfolio-ku — server PHP (≥ 8.1, + mbstring), dijalankan lewat bin/portfolio-ku.sh:
 *   PORTFOLIO_PROJECT=<project> php -S 127.0.0.1:8788 -t public public/index.php
 *   /kerja  /kerja/api/ping  /kerja/assets/<berkas>
 * Setara dengan bin/serve-node.mjs (rute, header, dan isi sama — dicek bin/parity.mjs).
 */
date_default_timezone_set('UTC');
require dirname(__DIR__) . '/lib/php/Http.php';

const MIME_TYPES = [
    'js' => 'text/javascript; charset=utf-8',
    'json' => 'application/json; charset=utf-8',
    'glb' => 'model/gltf-binary',
    'gltf' => 'model/gltf+json',
    'bin' => 'application/octet-stream',
    'png' => 'image/png',
    'jpg' => 'image/jpeg',
    'jpeg' => 'image/jpeg',
    'webp' => 'image/webp',
    'svg' => 'image/svg+xml',
];

$runtime = dirname(__DIR__);
$projectEnv = (string) getenv('PORTFOLIO_PROJECT');
$project = realpath($projectEnv !== '' ? $projectEnv : (string) getcwd());

$send = static function (int $status, array $headers, string $body = ''): never {
    http_response_code($status);
    foreach (KHttp::SECURITY_HEADERS + $headers as $k => $v) {
        header($k . ': ' . $v);
    }
    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'HEAD') {
        echo $body;
    }
    exit;
};
$text = ['Content-Type' => 'text/plain; charset=utf-8'];

if ($project === false) {
    $send(500, $text, 'Folder project tidak ditemukan');
}
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if ($method !== 'GET' && $method !== 'HEAD') {
    $send(405, $text + ['Allow' => 'GET, HEAD'], 'Metode tidak didukung');
}
if (!KHttp::hostAllowed(isset($_SERVER['HTTP_HOST']) ? (string) $_SERVER['HTTP_HOST'] : null, (string) getenv('PORTFOLIO_ALLOWED_HOSTS'))) {
    $send(421, $text, 'Host tidak dikenal');
}
$path = rtrim((string) parse_url((string) ($_SERVER['REQUEST_URI'] ?? '/'), PHP_URL_PATH), '/');

if ($path === '' || $path === '/index.php') {
    $send(302, ['Location' => '/kerja']);
}
if ($path === '/kerja/api/ping') {
    $send(200, ['Content-Type' => 'application/json; charset=utf-8', 'Cache-Control' => 'no-store'],
        (string) json_encode(['app' => 'portfolio-ku', 'project' => substr(md5($project), 0, 12), 'runtime' => 'php']));
}
if ($path === '/kerja') {
    $send(200, ['Content-Type' => 'text/html; charset=utf-8', 'Cache-Control' => 'no-cache'],
        (string) file_get_contents($runtime . '/views/page.html'));
}
if (str_starts_with($path, '/kerja/assets/')) {
    $rel = rawurldecode(substr($path, strlen('/kerja/assets/')));
    $base = realpath(__DIR__ . '/assets');
    $f = str_contains($rel, "\0") ? false : realpath(__DIR__ . '/assets/' . $rel);
    $ext = $f === false ? '' : strtolower((string) pathinfo($f, PATHINFO_EXTENSION));
    if ($base === false || $f === false || !str_starts_with($f, $base . DIRECTORY_SEPARATOR) || !is_file($f) || !isset(MIME_TYPES[$ext])) {
        $send(404, []);
    }
    $etag = '"' . dechex((int) filemtime($f)) . '-' . dechex((int) filesize($f)) . '"';
    $h = ['Content-Type' => MIME_TYPES[$ext], 'Cache-Control' => 'public, max-age=3600', 'ETag' => $etag];
    if (($_SERVER['HTTP_IF_NONE_MATCH'] ?? '') === $etag) {
        $send(304, $h);
    }
    // Berkas besar (model .glb ±130 MB) dialirkan agar tidak perlu dimuat seluruhnya ke memori PHP.
    http_response_code(200);
    foreach (KHttp::SECURITY_HEADERS + $h + ['Content-Length' => (string) filesize($f)] as $k => $v) {
        header($k . ': ' . $v);
    }
    if ($method !== 'HEAD') {
        readfile($f);
    }
    exit;
}
$send(404, $text, 'Tidak ditemukan');
