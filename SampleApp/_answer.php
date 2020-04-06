<?php

require_once(__DIR__ . '/config.php');
require_once(__DIR__ . '/Quiz.php');
require_once(__DIR__ . '/Token.php');

$quiz = new Myapp\Quiz();
try{
    $correctAnswer = $quiz->checkAnswer();
} catch(Exception $e) {
    header($_SERVER['SERVER_PROTOCOL'] . '403 Forbidden', true, 403);
    echo $e->getMessage();
    exit;
}
header('Content-Type: application/json; charset=UTF-8');
echo json_encode([
    'correct_answer' => $correctAnswer
]);