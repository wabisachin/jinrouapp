<?php

require_once(__DIR__ . '/config.php');
require_once(__DIR__ . '/Quiz.php');
require_once(__DIR__ . '/Token.php');
$quiz = new MyApp\Quiz();
if (!$quiz->isFinished()){
    $data = $quiz->getCurrentQuiz();
    shuffle($data['a']);
}

?>

<!DCOTYPE html>
<html>
<head>
    <meta charset = "utf-8">
    <title>Quiz</title>
    <link rel = "stylesheet" href = "styles.css">
</head>
<body>
    <?php if ($quiz -> isFinished()) : ?>
        <div id="container">
          <div id="result">
            Your score ...
            <div><?= h($quiz->getScore()); ?>%</div>
          </div>
          <a href=""><div id="btn">Replay?</div></a>
        </div>
        <?php $quiz->reset(); ?>
    <?php else : ?>
        <div id= "container">
            <h1>Q. <? h($data['q']); ?></h1>
            <ul>
                <?php foreach ($data['a'] as $a) : ?>
                    <li class = "answer"><?= h($a); ?></li>
                <?php endforeach; ?>
            </ul>
        </div>
        <div id = "btn" class = "disabled"><?= $quiz->isLast() ? 'Show Result' : 'Next question'; ?></div>
        <input type="hidden" id="token" value="<?= h($_SESSION['token']); ?>">
        <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.4.1/jquery.min.js"></script>
        <script src="quiz.js"></script>
    <?php endif; ?>
    
</body>
</html>