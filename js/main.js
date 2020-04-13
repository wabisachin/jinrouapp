'use strict';

//設定値を初期化
let playerNum = 0;
let villager = 0;
let wolfman = 0;
let thief = 0;
let fortune = 0;

// 人数分のフォームとカードを表示
function showForm (num) {
    let userArea = $(`<div id="userArea${num}" class="userArea">`);
    let number = $(`<p>`); 
    let form = $(`<form id="userName${num}">`); 
    let userNameForm = $('<input type="text">'); 
    let submit = $('<input type="submit" value="参加">');
    let card = $('<div class="card">');

    $('#villageField').append(userArea);
    $(`#userArea${num}`).append(number).text('Player' + num);
    $(`#userArea${num}`).append(form);
    $(`#userArea${num}`).append(userNameForm);
    $(`#userArea${num}`).append(submit);
    $(`#userArea${num}`).append(card);
}
// 墓地にカードを二枚表示
function showCemetry(num) {
    let cemetryCard1 = $(`<div class="card" id=cemetry1>`);
    let cemetryCard2 = $(`<div class="card" id=cemetry2>`);
    $('#cemetryField').append(cemetryCard1);
    $('#cemetryField').append(cemetryCard2);

}
            
$(function(){
    
    //村作成ボタンを押したとき
    $('#settings').submit( e => {
        //設定値を取得
        playerNum = parseInt($('#playerNum').val(), 10);
        villager = parseInt($('#villager').val(), 10);
        wolfman = parseInt($('#wolfman').val(), 10);
        thief = parseInt($('#thief').val(), 10);
        fortune = parseInt($('#fortune').val(), 10);
        e.preventDefault();
        if (playerNum + 2 === (villager + wolfman + thief + fortune)) {
            //フィールド表示、カードが表示されていれば削除
            $('.field').css('display', 'inline');
            $('#villageField').children().remove();
            $('#cemetryField').children().remove();

            //人数分のフィールドを表示
            for (let i = 1; i < playerNum + 1; i++) {
                showForm(i);
            }
            //墓地に二枚カード表示
            showCemetry();

        } else {
            alert('合計をプレイヤー人数+2枚にしてください。');
        }
    });

});
