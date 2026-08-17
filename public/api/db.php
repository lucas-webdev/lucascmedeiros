<?php

function futebol_carregar_config(): void
{
    static $carregado = false;
    if ($carregado) {
        return;
    }

    $configPath = __DIR__ . '/config.php';
    if (!file_exists($configPath)) {
        throw new RuntimeException(
            'config.php não existe em public/api/. Verifique se os GitHub Secrets ' .
            '(FUTEBOL_DB_HOST, FUTEBOL_DB_NAME, FUTEBOL_DB_USER, FUTEBOL_DB_PASSWORD, FUTEBOL_PIN) ' .
            'foram cadastrados e se o workflow de deploy rodou com sucesso após isso.'
        );
    }

    require_once $configPath;

    foreach (['DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASS', 'ADMIN_PIN'] as $const) {
        if (!defined($const) || constant($const) === '') {
            throw new RuntimeException(
                "A constante $const não está definida (ou está vazia) em config.php. " .
                'O GitHub Secret correspondente provavelmente não foi cadastrado.'
            );
        }
    }

    $carregado = true;
}

function futebol_db(): PDO
{
    static $pdo = null;

    if ($pdo === null) {
        futebol_carregar_config();

        $dsn = 'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4';
        $pdo = new PDO($dsn, DB_USER, DB_PASS, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]);
    }

    return $pdo;
}
