<?php

declare(strict_types=1);

/**
 * Proxy para a XML API2 do BoardGameGeek (somente leitura, endpoint `plays`).
 *
 * Por que existe: o BGG exige `Authorization: Bearer <token>` em toda chamada e
 * recomenda que as requisições saiam do servidor (com cache), nunca do browser.
 * O token fica em config.php (gerado no deploy a partir do GitHub Secret
 * BGG_API_KEY, gravado como BGG_TOKEN) e nunca chega ao frontend.
 *
 * GET /api/bgg.php?action=plays&username=NOME&page=1
 */

header('Content-Type: application/json; charset=utf-8');

$configPath = __DIR__ . '/config.php';
if (file_exists($configPath)) {
    require_once $configPath;
}
if (!defined('BGG_TOKEN')) {
    define('BGG_TOKEN', '');
}
// Sobrescrevível só para testes locais (servidor falso do BGG).
if (!defined('BGG_BASE_URL')) {
    define('BGG_BASE_URL', 'https://boardgamegeek.com/xmlapi2');
}

const BGG_CACHE_TTL = 600;        // segundos que uma página de plays fica em cache
const BGG_MIN_GAP_MICRO = 1000000; // intervalo mínimo entre chamadas ao BGG (1 s)
const BGG_RETRY_AFTER = 5;        // dica de espera para o cliente quando o BGG está ocupado

function json_out(array $data, int $status = 200): never
{
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE);
    exit;
}

function bgg_cache_dir(): string
{
    $dir = sys_get_temp_dir() . '/bgg-cache';
    if (!is_dir($dir)) {
        @mkdir($dir, 0700, true);
    }
    return $dir;
}

function bgg_cache_get(string $key): ?string
{
    $file = bgg_cache_dir() . '/' . $key . '.json';
    if (is_file($file) && (time() - (int)filemtime($file)) < BGG_CACHE_TTL) {
        $conteudo = @file_get_contents($file);
        return $conteudo === false ? null : $conteudo;
    }
    return null;
}

function bgg_cache_put(string $key, string $json): void
{
    $dir = bgg_cache_dir();
    $tmp = tempnam($dir, 'tmp');
    if ($tmp === false) {
        return; // cache é só otimização; falhar aqui não pode derrubar a resposta
    }
    if (@file_put_contents($tmp, $json) === false || !@rename($tmp, $dir . '/' . $key . '.json')) {
        @unlink($tmp);
    }
}

/** Garante um intervalo mínimo entre chamadas ao BGG, mesmo com requisições concorrentes. */
function bgg_throttle(): void
{
    $lock = @fopen(bgg_cache_dir() . '/throttle.lock', 'c+');
    if ($lock === false || !flock($lock, LOCK_EX)) {
        return;
    }
    $ultima = (int)trim((string)stream_get_contents($lock));
    $agora = (int)(microtime(true) * 1000000);
    $espera = BGG_MIN_GAP_MICRO - ($agora - $ultima);
    if ($espera > 0) {
        usleep($espera);
    }
    ftruncate($lock, 0);
    rewind($lock);
    fwrite($lock, (string)(int)(microtime(true) * 1000000));
    fflush($lock);
    flock($lock, LOCK_UN);
    fclose($lock);
}

/** @return array{0:int,1:string} [status HTTP, corpo] — status 0 = falha de rede */
function bgg_http_get(string $url): array
{
    $headers = [
        'Authorization: Bearer ' . BGG_TOKEN,
        'Accept: application/xml',
        'User-Agent: lucascmedeiros.com.br/jogos (uso pessoal)',
    ];

    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER => $headers,
            CURLOPT_TIMEOUT => 20,
            CURLOPT_CONNECTTIMEOUT => 8,
            CURLOPT_FOLLOWLOCATION => false, // um redirect poderia reenviar o token a outro host
        ]);
        $corpo = curl_exec($ch);
        $status = (int)curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
        curl_close($ch);
        return [$corpo === false ? 0 : $status, $corpo === false ? '' : (string)$corpo];
    }

    $ctx = stream_context_create(['http' => [
        'method' => 'GET',
        'header' => implode("\r\n", $headers),
        'timeout' => 20,
        'ignore_errors' => true,
        'follow_location' => 0,
    ]]);
    $corpo = @file_get_contents($url, false, $ctx);
    $status = 0;
    if (isset($http_response_header[0]) && preg_match('#\s(\d{3})\s#', $http_response_header[0], $m)) {
        $status = (int)$m[1];
    }
    return [$corpo === false ? 0 : $status, $corpo === false ? '' : $corpo];
}

function attr(SimpleXMLElement $el, string $nome): string
{
    return (string)($el[$nome] ?? '');
}

/** Converte o XML de `plays` no JSON consumido pelo frontend. Campos do BGG não são alterados. */
function bgg_plays_para_array(SimpleXMLElement $raiz): array
{
    $partidas = [];
    foreach ($raiz->play as $play) {
        $item = $play->item;
        $subtipos = [];
        if ($item !== null && isset($item->subtypes->subtype)) {
            foreach ($item->subtypes->subtype as $s) {
                $subtipos[] = attr($s, 'value');
            }
        }

        $jogadores = [];
        if (isset($play->players->player)) {
            foreach ($play->players->player as $p) {
                $jogadores[] = [
                    'username' => attr($p, 'username'),
                    'userid' => (int)attr($p, 'userid'),
                    'name' => attr($p, 'name'),
                    'startPosition' => attr($p, 'startposition'),
                    'color' => attr($p, 'color'),
                    'score' => attr($p, 'score'),
                    'isNew' => attr($p, 'new') === '1',
                    'rating' => (float)attr($p, 'rating'),
                    'win' => attr($p, 'win') === '1',
                ];
            }
        }

        $partidas[] = [
            'id' => (int)attr($play, 'id'),
            'date' => attr($play, 'date'),
            'quantity' => max(1, (int)attr($play, 'quantity')),
            'length' => (int)attr($play, 'length'),
            'incomplete' => attr($play, 'incomplete') === '1',
            'noWinStats' => attr($play, 'nowinstats') === '1',
            'location' => attr($play, 'location'),
            'comments' => trim((string)($play->comments ?? '')),
            'game' => [
                'id' => $item !== null ? (int)attr($item, 'objectid') : 0,
                'name' => $item !== null ? attr($item, 'name') : '',
                'subtypes' => $subtipos,
            ],
            'players' => $jogadores,
        ];
    }

    return [
        'source' => 'BoardGameGeek',
        'username' => attr($raiz, 'username'),
        'userId' => (int)attr($raiz, 'userid'),
        'total' => (int)attr($raiz, 'total'),
        'page' => (int)attr($raiz, 'page'),
        'plays' => $partidas,
    ];
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET' || ($_GET['action'] ?? '') !== 'plays') {
    json_out(['error' => 'Ação inválida'], 400);
}

$username = trim((string)($_GET['username'] ?? ''));
if ($username === '' || !preg_match('/^[\p{L}\p{N}_\-. ]{1,64}$/u', $username)) {
    json_out(['error' => 'Nome de usuário inválido'], 400);
}

$pagina = (int)($_GET['page'] ?? 1);
if ($pagina < 1 || $pagina > 500) {
    json_out(['error' => 'Página inválida'], 400);
}

if (BGG_TOKEN === '') {
    json_out([
        'error' => 'Token do BGG não configurado no servidor.',
        'detalhe' => 'Cadastre o GitHub Secret BGG_API_KEY e rode o deploy.',
    ], 503);
}

$chave = sha1(mb_strtolower($username) . '|' . $pagina);
$emCache = bgg_cache_get($chave);
if ($emCache !== null) {
    header('X-Cache: HIT');
    echo $emCache;
    exit;
}

$url = BGG_BASE_URL . '/plays?' . http_build_query(['username' => $username, 'page' => $pagina]);

bgg_throttle();
[$status, $corpo] = bgg_http_get($url);

if ($status === 0) {
    json_out(['error' => 'Não foi possível contatar o BoardGameGeek.'], 502);
}
if ($status === 401 || $status === 403) {
    error_log("[bgg] token recusado (HTTP $status)");
    json_out(['error' => 'O BoardGameGeek recusou o token do servidor.'], 502);
}
// 202 = pedido enfileirado; 429/5xx = BGG ocupado. O cliente tenta de novo.
if (in_array($status, [202, 429, 500, 502, 503, 504], true)) {
    header('Retry-After: ' . BGG_RETRY_AFTER);
    json_out(['error' => 'O BoardGameGeek está ocupado.', 'retryAfter' => BGG_RETRY_AFTER], 503);
}
if ($status !== 200) {
    error_log("[bgg] status inesperado $status: " . substr($corpo, 0, 300));
    json_out(['error' => "Resposta inesperada do BoardGameGeek (HTTP $status)."], 502);
}

libxml_use_internal_errors(true);
$xml = simplexml_load_string($corpo);
if ($xml === false || $xml->getName() !== 'plays') {
    error_log('[bgg] corpo inesperado: ' . substr($corpo, 0, 300));
    // Bug documentado em "XML API Enhancements": para um usuário inexistente,
    // `plays` devolve HTML da web em vez de XML vazio.
    if (preg_match('/<\s*(!doctype\s+html|html|body|div)\b/i', $corpo)) {
        json_out(['error' => 'Usuário não encontrado no BoardGameGeek.'], 404);
    }
    json_out(['error' => 'Resposta do BoardGameGeek em formato inesperado.'], 502);
}

$json = json_encode(bgg_plays_para_array($xml), JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE);
bgg_cache_put($chave, (string)$json);
header('X-Cache: MISS');
echo $json;
