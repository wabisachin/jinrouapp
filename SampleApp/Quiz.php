<?php

namespace MyApp;

class Quiz {
    private $_quizSet = [];
    public function __construct(){
        $this->_setup();
        Token::create();
        if (!isset($_SESSION['current_num'])){
            $this->_initSession();
        }
    }
    
    private function _initSession() {
        $_SESSION['current_num'] = 0;
        $_SESSION['correct_count'] = 0;
    }
    
    public function checkAnswer(){
        Token::validate('token');
        $correctAnswer = $this->_quizSet[$_SESSION['current_num']]['a'][0];
        if (!isset($_POST['answer'])){
            throw new \Exception('answer not set!');
        }
        if ($correctAnswer === $_POST['answer']){
            $_SESSION['correct_count']++;
        }
        $_SESSION['current_num']++;
        return $correctAnswer;
    }
    
    public function isFinished(){
        return count($this->_quizSet) === $_SESSION['current_num'];
    }
    public function isLast(){
        return count($this->_quizSet) === $_SESSION['current_num'] + 1;
    }
    public function getScore(){
        return round($_SESSION['correct_count'] / count($this->_quizSet) * 100);
    }
    public function reset(){
        $this->_initSession();
    }
    public function getCurrentQuiz(){
        return $this->_quizSet[$_SESSION['current_num']];
    }
    
    private function _setup(){
        $this->_quizSet[] = [
            'q' => 'what is A?',
            'a' => ['A0','A1','A2','A3' ]
            ];
        $this->_quizSet[] = [
            'q' => 'what is B?',
            'a' => ['B0','B1','B2','B3' ]
            ];
        $this->_quizSet[] = [
            'q' => 'what is C?',
            'a' => ['C0','C1','C2','C3' ]
            ];
    }
}