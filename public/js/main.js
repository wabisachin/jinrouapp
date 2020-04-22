'use strict';

 /*----------------------------------------------------------------------------
 
                  グローバル変数定義
 
 ----------------------------------------------------------------------------*/


//設定値を初期化
let playerNum = 0;
let villager = 0;
let wolfman = 0;
let thief = 0;
let fortune = 0;

 /*----------------------------------------------------------------------------
 
                  関数定義
 
 ----------------------------------------------------------------------------*/

// 隠しフィールドの追加、未設定だったid,classの指定
function showForm (num) {
    let userArea = $(`<div id="userArea${num}" class="userArea">`);
    let number = $(`<p id="name${num}">Player${num}</p>`); 
    let form = $(`<form class="userName" id="userName${num}">`); 
    let userNameForm = $(`<input type="text" id="nameSet${num}">`); 
    let playerNum = $(`<input type="hidden"  id="playerNum${num}" value="${num}">`); 
    let submit = $(`<input type="submit" id="join${num}" value="参加">`);
    let card = $(`<div class="card" id="card${num}">`);


    $('#villageField').append(userArea);
    $(`#userArea${num}`).append(number);
    $(`#userArea${num}`).append(form);
    $(`#userName${num}`).append(userNameForm);
    $(`#userName${num}`).append(playerNum);
    $(`#userName${num}`).append(submit);
    $(`#userArea${num}`).append(card);
}

// 墓地にカードを二枚表示
function showCemetry(playerNum) {
    let cemetry1 = playerNum + 1;
    let cemetry2 = playerNum + 2;
    // let cemetryCard1 = $(`<div class="card" id=cemetry1>`);
    // let cemetryCard2 = $(`<div class="card" id=cemetry2>`); 
    let cemetryCard1 = $(`<div class="card" id="card${playerNum +1}">`);
    let cemetryCard2 = $(`<div class="card" id="card${playerNum +2}">`);
    $('#cemetryField').append(cemetryCard1);
    $('#cemetryField').append(cemetryCard2);
}

// URLが部屋ページかどうかの判定
function isRoomPage() {
    let page = location.pathname;
    let result = page.split('/');
    return (result[1] != "") ? true :false;
}

// URLから部屋番号を抽出
function getRoomId() {
    let page = location.pathname;
    let result = page.split('/');
    
    return result[1];
}

// Cookieをハッシュ形式に変換
function getCookieArray(){
  var arr = new Array();
  if(document.cookie != ''){
    var tmp = document.cookie.split('; ');
    for(var i=0;i<tmp.length;i++){
      var data = tmp[i].split('=');
      arr[data[0]] = decodeURIComponent(data[1]);
    }
  }
  return arr;
}


 /*----------------------------------------------------------------------------
 
                  Vue.js
 
 ----------------------------------------------------------------------------*/
 //部屋作成の設定値の審査
var app = new Vue({
  el: '#settings',
  data: { 
    playerNum: 3,
    villager: 2,
    wolfman: 2,
    thief: 0,
    fortune: 1,
},
  computed: {
    total: function(){
        return this.villager + this.wolfman + this.thief + this.fortune
    }
  }

  });
  
 /*----------------------------------------------------------------------------
 
                  ページ動作
 
 ----------------------------------------------------------------------------*/
            
$(function(){

    let socket = io.connect();
    
    socket.emit("getId_from_client");
    
    // 村作成ボタンを押したとき
    // $('#settings').submit( e => {
    //     //設定値を取得
    //     playerNum = parseInt($('#playerNum').val(), 10);
    //     villager = parseInt($('#villager').val(), 10);
    //     wolfman = parseInt($('#wolfman').val(), 10);
    //     thief = parseInt($('#thief').val(), 10);
    //     fortune = parseInt($('#fortune').val(), 10);
    //     e.preventDefault();
    //     if (playerNum + 2 === (villager + wolfman + thief + fortune)) {
    //         //フィールド表示、カードが表示されていれば削除
    //         $('.field').css('display', 'inline');
    //         $('#villageField').children().remove();
    //         $('#cemetryField').children().remove();
            
    //     socket.emit('settings_from_master', {
    //         playerNum:  playerNum,
    //         villager:   villager,
    //         wolfman:    wolfman,
    //         thief:  thief,
    //         fortune:    fortune
    //     });

    //     } else {
    //         alert('合計をプレイヤー人数+2枚にしてください。');
    //     }
    //     サーバーに設定情報を送信する。
    //             socket.emit('settings_from_master', {  -->上のif文の中に移動
    //         playerNum:  playerNum,
    //         villager:   villager,
    //         wolfman:    wolfman,
    //         thief:  thief,
    //         fortune:    fortune
    //     });

    //     // 参加ボタンを押した時のクリックアクション
    //     for (let num = 0; num < playerNum; num++) {
    //         $(document).on('submit', `#userName${num+1}`, (e) => {
    //             e.preventDefault();
    //             socket.emit('join_from_player', {
    //                 name: $(this).find(`#nameSet${num+1}`).val(),
    //                 num: $(this).find(`#playerNum${num+1}`).val()
    //             });
    //         });
    //     }

        
    // });

    // socket.on('settings_from_server', data => {
    //     console.log(data.wolfman);
    //     playerNum = data.playerNum;
    //     //人数分のフィールドを表示
    //     for (let i = 1; i < playerNum + 1; i++) {
    //         showForm(i);
    //     }
    //     //墓地に二枚カード表示
    //     showCemetry(playerNum);
    // });
    console.log("cookieの表示")
    console.log(document.cookie);
    
    // roomページに遷移した場合の処理
    if (isRoomPage()) {
        let roomId = getRoomId();
        // socketに部屋番号に応じたルームを作成
        socket.emit('joinRoom_from_client', roomId);
        // 夜へボタンを押した時
        $('#toNight').on('click', () => {
            socket.emit('toNightClicked', roomId);
        });
        
    }
    
    
    socket.on('roles_from_server', roles => {
        for (var i = 0; i < roles.length; i++) {
            // $(`#card${i+1}`).text(roles[i]);
        }
        
    })
    
    socket.on('join_from_server', data => {
        // player名の変更
        $(`#name${data.num}`).text(data.name);
        // フォームを非表示
        $(`#userName${data.num}`).css("display", "none");
    })
    
    socket.on('new_client_join', () => {
    //   location.reload();
    });
    
    socket.on('roles_asigned', () => {
        
    });
    
    socket.on('roles_asigned', ()=> {
        let roomId = getRoomId();
        let cookie = getCookieArray();
        let sessionId = cookie["sessionId"];
        // let sessionId = document.cookie.sessionId;
        socket.emit('request_role', roomId, sessionId);
    });
    
    socket.on('give_role', data => {
        
        $(`#card${data.plyerNo}`).text(data.userRole);
    }  )

});
