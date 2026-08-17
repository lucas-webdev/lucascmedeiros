<?php

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/db.php';

function json_out(array $data, int $status = 200): never
{
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function read_json_body(): array
{
    $raw = file_get_contents('php://input');
    $data = json_decode($raw ?: '[]', true);
    return is_array($data) ? $data : [];
}

function require_pin(array $body): void
{
    $pin = (string)($body['pin'] ?? '');
    if ($pin === '' || !hash_equals(ADMIN_PIN, $pin)) {
        json_out(['error' => 'PIN inválido'], 401);
    }
}

/**
 * Reduz uma exceção a um formato seguro para expor na resposta: inclui o
 * código SQLSTATE/driver (útil pra diagnosticar host/credenciais erradas)
 * mas nunca a string de conexão ou a senha. O erro completo sempre vai
 * pro error_log do PHP também.
 */
function detalhe_seguro_do_erro(Throwable $e): string
{
    if ($e instanceof PDOException) {
        return 'Erro de banco de dados (código ' . $e->getCode() . '): ' . $e->getMessage();
    }
    return $e->getMessage();
}

function clean_nome(mixed $nome): string
{
    $nome = trim((string)$nome);
    if ($nome === '' || mb_strlen($nome) > 100) {
        json_out(['error' => 'Nome inválido'], 400);
    }
    return $nome;
}

$action = $_GET['action'] ?? '';
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET' && $action === 'debug') {
    $pin = (string)($_GET['pin'] ?? '');
    $info = [
        'php_version' => PHP_VERSION,
        'pdo_drivers' => PDO::getAvailableDrivers(),
        'config_php_existe' => file_exists(__DIR__ . '/config.php'),
    ];

    try {
        futebol_carregar_config();
        $info['constantes'] = [
            'DB_HOST' => 'ok (' . DB_HOST . ')',
            'DB_NAME' => 'ok (' . DB_NAME . ')',
            'DB_USER' => 'ok (' . DB_USER . ')',
            'DB_PASS' => 'ok (' . strlen(DB_PASS) . ' caractere(s))',
            'ADMIN_PIN' => 'ok (' . strlen(ADMIN_PIN) . ' caractere(s))',
        ];
    } catch (Throwable $e) {
        $info['config_erro'] = $e->getMessage();
        json_out($info, 500);
    }

    if ($pin === '' || !hash_equals(ADMIN_PIN, $pin)) {
        json_out(['error' => 'PIN inválido. Use ?action=debug&pin=SEUPIN para ver o diagnóstico completo.'] + $info, 401);
    }

    try {
        $pdo = futebol_db();
        $pdo->query('SELECT 1');
        $info['conexao'] = 'ok';
        $info['tabelas'] = $pdo->query('SHOW TABLES')->fetchAll(PDO::FETCH_COLUMN);
    } catch (Throwable $e) {
        error_log('[futebol debug] ' . $e->getMessage());
        $info['conexao'] = 'falhou';
        $info['erro'] = detalhe_seguro_do_erro($e);
        json_out($info, 500);
    }

    json_out($info);
}

try {
    $pdo = futebol_db();

    if ($method === 'GET' && $action === 'players') {
        $stmt = $pdo->query(
            'SELECT id, nome, mensalista, pontos, jogos, gols, assistencias
             FROM jogadores WHERE ativo = 1 ORDER BY mensalista DESC, nome ASC'
        );
        json_out(['jogadores' => $stmt->fetchAll()]);
    }

    if ($method === 'GET' && $action === 'ranking') {
        $stmt = $pdo->query(
            'SELECT id, nome, mensalista, pontos, jogos, gols, assistencias
             FROM jogadores WHERE ativo = 1
             ORDER BY pontos DESC, jogos DESC, gols DESC, nome ASC'
        );
        json_out(['jogadores' => $stmt->fetchAll()]);
    }

    if ($method === 'POST' && $action === 'add_player') {
        $body = read_json_body();
        require_pin($body);
        $nome = clean_nome($body['nome'] ?? '');
        $mensalista = !empty($body['mensalista']) ? 1 : 0;

        $stmt = $pdo->prepare('INSERT INTO jogadores (nome, mensalista) VALUES (?, ?)');
        $stmt->execute([$nome, $mensalista]);

        json_out(['id' => (int)$pdo->lastInsertId()], 201);
    }

    if ($method === 'POST' && $action === 'update_player') {
        $body = read_json_body();
        require_pin($body);
        $id = (int)($body['id'] ?? 0);
        if ($id <= 0) {
            json_out(['error' => 'id inválido'], 400);
        }
        $nome = clean_nome($body['nome'] ?? '');
        $mensalista = !empty($body['mensalista']) ? 1 : 0;
        $ativo = array_key_exists('ativo', $body) && !$body['ativo'] ? 0 : 1;

        $stmt = $pdo->prepare('UPDATE jogadores SET nome = ?, mensalista = ?, ativo = ? WHERE id = ?');
        $stmt->execute([$nome, $mensalista, $ativo, $id]);

        json_out(['ok' => true]);
    }

    if ($method === 'POST' && $action === 'submit_match') {
        $body = read_json_body();
        require_pin($body);

        $data = (string)($body['data'] ?? '');
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $data)) {
            json_out(['error' => 'data inválida'], 400);
        }

        $numTimes = (int)($body['numTimes'] ?? 0);
        if ($numTimes < 2) {
            json_out(['error' => 'numTimes inválido'], 400);
        }

        $placar = $body['placar'] ?? null;
        $placarTime1 = null;
        $placarTime2 = null;
        if ($numTimes === 2 && is_array($placar) && count($placar) === 2) {
            $placarTime1 = (int)$placar[0];
            $placarTime2 = (int)$placar[1];
        }

        $jogadores = $body['jogadores'] ?? [];
        if (!is_array($jogadores) || count($jogadores) === 0) {
            json_out(['error' => 'jogadores inválido'], 400);
        }

        $vencedorTime = null;
        $empate = false;
        if ($placarTime1 !== null && $placarTime2 !== null) {
            if ($placarTime1 === $placarTime2) {
                $empate = true;
            } else {
                $vencedorTime = $placarTime1 > $placarTime2 ? 1 : 2;
            }
        }

        $pdo->beginTransaction();

        $stmt = $pdo->prepare(
            'INSERT INTO partidas (data, num_times, placar_time1, placar_time2) VALUES (?, ?, ?, ?)'
        );
        $stmt->execute([$data, $numTimes, $placarTime1, $placarTime2]);
        $partidaId = (int)$pdo->lastInsertId();

        $insertJogador = $pdo->prepare(
            'INSERT INTO partida_jogadores (partida_id, jogador_id, time_numero, gols, assistencias)
             VALUES (?, ?, ?, ?, ?)'
        );
        $updateStats = $pdo->prepare(
            'UPDATE jogadores SET pontos = pontos + ?, jogos = jogos + 1, gols = gols + ?, assistencias = assistencias + ?
             WHERE id = ?'
        );

        foreach ($jogadores as $j) {
            $jogadorId = (int)($j['id'] ?? 0);
            $timeNumero = (int)($j['timeNumero'] ?? 0);
            $gols = max(0, (int)($j['gols'] ?? 0));
            $assistencias = max(0, (int)($j['assistencias'] ?? 0));

            if ($jogadorId <= 0 || $timeNumero <= 0) {
                continue;
            }

            $insertJogador->execute([$partidaId, $jogadorId, $timeNumero, $gols, $assistencias]);

            $pontosDelta = 0;
            if ($empate) {
                $pontosDelta = 1;
            } elseif ($vencedorTime !== null && $timeNumero === $vencedorTime) {
                $pontosDelta = 3;
            }

            $updateStats->execute([$pontosDelta, $gols, $assistencias, $jogadorId]);
        }

        $pdo->commit();

        json_out(['partidaId' => $partidaId], 201);
    }

    json_out(['error' => 'Ação não encontrada'], 404);
} catch (Throwable $e) {
    if (isset($pdo) && $pdo instanceof PDO && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log('[futebol] ' . $e->getMessage());
    json_out([
        'error' => 'Erro no servidor',
        'detalhe' => detalhe_seguro_do_erro($e),
    ], 500);
}
