'use strict';



//設定値を初期化
let playerNum = 0;
let villager = 0;
let wolfman = 0;
let thief = 0;
let fortune = 0;

// 人数分のフォームとカードを表示

// オッパイオッパイオッパイ by wasabi
// 隠しフィールドの追加、未設定だったid,classの指定
function showForm (num) {
    let userArea = $(`<div id="userArea${num}" class="userArea">`);
    let number = $(`<p id="name${num}">Player${num}</p>`); 
    let form = $(`<form class="userName" id="userName${num}">`); 
    let userNameForm = $(`<input type="text" class="nameSet" id="nameSet${num}">`); 
    let playerNum = $(`<input type="hidden" class="playerNum" id="playerNum${num}" value="${num}">`); 
    let submit = $(`<input type="submit" class="join" id="join${num}" value="参加">`);
    let card = $('<div class="card">');

    $('#villageField').append(userArea);
    $(`#userArea${num}`).append(number);
    $(`#userArea${num}`).append(form);
    $(`#userName${num}`).append(userNameForm);
    $(`#userName${num}`).append(playerNum);
    $(`#userName${num}`).append(submit);
    $(`#userArea${num}`).append(card);
    
    // 参加ボタン押した時のクリックアクション
    // $(document).on('submit', `#userName${num}`, (e) => {
    //     console.log($(this).find(`#nameSet${num}`).val());
    //     console.log($(this).find(`#playerNum${num}`).val());
    //     e.preventDefault();
    //     socket.emit('join_from_player', {
    //         name: $(this).find(`#nameSet${num}`).val(),
    //         num: $(this).find(`#playerNum${num}`).val()
    //     });
    // });
};
// 墓地にカードを二枚表示
function showCemetry(num) {
    let cemetryCard1 = $(`<div class="card" id=cemetry1>`);
    let cemetryCard2 = $(`<div class="card" id=cemetry2>`);
    $('#cemetryField').append(cemetryCard1);
    $('#cemetryField').append(cemetryCard2);

}
            
$(function(){

    let socket = io.connect();
    
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

        } else {
            alert('合計をプレイヤー人数+2枚にしてください。');
        }

        //サーバーに設定情報を送信する。
        socket.emit('settings_from_master', {
            playerNum:  playerNum,
            villager:   villager,
            wolfman:    wolfman,
            thief:  thief,
            fortune:    fortune
        });
        
        // 参加ボタンを押した時のクリックアクション
        for (let num = 0; num < playerNum; num++) {
            $(document).on('submit', `#userName${num+1}`, (e) => {
                e.preventDefault();
                socket.emit('join_from_player', {
                    name: $(this).find(`#nameSet${num+1}`).val(),
                    num: $(this).find(`#playerNum${num+1}`).val()
                });
            });
        }

        
    });

    socket.on('settings_from_server', data => {
        console.log(data.wolfman);
        playerNum = data.playerNum;
        //人数分のフィールドを表示
        for (let i = 1; i < playerNum + 1; i++) {
            showForm(i);
        }
        //墓地に二枚カード表示
        showCemetry();
    });

    socket.on('join_from_server', data => {
        // player名の変更
        $(`#name${data.num}`).text(data.name);
        // フォームを非表示
        $(`#userName${data.num}`).css("display", "none");
    })

});


