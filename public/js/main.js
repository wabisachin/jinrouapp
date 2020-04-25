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

// タイマーをスタートし、残り時間を表示。
function startTimer(time) {
    let countDown = function() {
        
        $('#restTime').text(`Time: ${Math.round(time/60)}分${time%60}秒`);
        time--;
        var id = setTimeout(countDown, 1000);
        if (time < 0) {
            clearTimeout(id);
            // 音声ファイルの再生
            // $( '#sound-file' ).get(0).play();
            $('#restTime').text('timeUp！人狼を選択！');
        }
    }
    countDown();
}

// Initialフェーズ画面表示
function initial () {
    $('body').addClass('initial');
    $('#toDate').addClass('disabled');
    $('#result').addClass('disabled');
}
// 夜フェーズ画面表示
function night () {
    $('#toNight').addClass('disabled');
    $('#toDate').removeClass('disabled');
    $('#result').addClass('disabled');
    $('body').removeClass('initial');
    $('body').addClass('night');
    $('#plate').addClass('nightPlate');
}
function date () {
    $('#toDate').addClass('disabled');
    $('#toNight').addClass('disabled');
    $('#result').removeClass('disabled');
    $('body').css('background-color', 'none');
    $('body').removeClass('night');
    $('body').addClass('date');
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
    
    console.log("cookieの表示")
    console.log(document.cookie);
    
    // roomページに遷移した場合の処理
    if (isRoomPage()) {
        let cookie = getCookieArray();
        let roomId = getRoomId();
        let sessionId = cookie["sessionId"];
        initial();
        // socketに部屋番号に応じたルームを作成
        socket.emit('joinRoom_from_client', {
            roomId: roomId, 
            sessionId: sessionId
        });
        
        // 夜へボタンを押した時
        $('#toNight').on('click', () => {
            socket.emit('toNightClicked', roomId);
            $('#toNight').addClass("limitted");
            $('#toDate').removeClass("limitted")
        });
        // 昼へボタンを押した時
        $('#toDate').on('click', () => {
            console.log("ok")
            $('#toDate').addClass("limitted");
            socket.emit("day_begins", roomId);
        })
        
    }
    
    // 新しいクライアント入室をトリガにページリロード
    socket.on('new_client_join', () => {
        window.location.reload();
    //   location.reload();
    });
    
    // socket.on('roles_asigned', () => {
        
    // });
    
    // 自分のsessionIdでサーバに自分のプレイヤー情報問い合せ
    socket.on('roles_asigned', ()=> {
        let roomId = getRoomId();
        let cookie = getCookieArray();
        let sessionId = cookie["sessionId"];
        // let sessionId = document.cookie.sessionId;
        night();
        socket.emit('request_role', roomId, sessionId);
    });
    
    // 自分のフィールドに役職表示、自分の役職をサーバに通知
    socket.on('give_role', data => {
        $(`#card${data.playerNo}`).text(data.userRole);
        // 自分の役職のメソッドをサーバに要求する
        switch (data.userRole) {
            case 'wolfman':
                socket.emit('i_am_wolfman', getRoomId());
                socket.on('all_wolfman', wolfmanList => {
                    wolfmanList.forEach( wolfmanInfo => {
                        $(`#card${wolfmanInfo.playerNo}`).text(wolfmanInfo.userRole);
                    }  );
                });
                break;
            case 'fortune':
                $('.card').css('cursor', 'pointer');
                $(`#card${data.playerNo}`).css('pointer-events',  'none');
                $('.card').click( (e) => {
                    let targetNo = parseInt(e.currentTarget.id.substr(4));
                    $('.card').css('pointer-events',  'none');
                    socket.emit('i_am_fortune', getRoomId() ,targetNo);
                    socket.on('fortune_result', fortuneResult => {
                        fortuneResult.forEach( result => {
                            $(`#card${result.playerNo}`).text(result.userRole);
                        } );
                    });
                });
                break;
            case 'thief':
                $('.card').css('cursor', 'pointer');
                $(`#card${data.playerNo}, #card-1, #card-2`).css('pointer-events',  'none');
                $('.card').click( (e) => {
                    let thiefNo = data.playerNo;
                    let targetNo = parseInt(e.currentTarget.id.substr(4));
                    $('.card').css('pointer-events',  'none');
                    socket.emit('i_am_thief', getRoomId() ,targetNo, thiefNo);
                    socket.on('thief_result', thiefResult => {
                        thiefResult.forEach( result => {
                            $(`#card${result.playerNo}`).text(result.userRole);
                        } );
                    });
                    socket.on("are_you_thief", () => {
                       socket.emit("thief_action", getRoomId(), targetNo, thiefNo); 
                    });
                });
                break;
            
            default:
                // code
        }
    });
    
    // 昼のスタート
    socket.on("notice_day_started", (playerNum) => {
        // タイマーの秒数を設定
        let setCount = 5;
        date();
        $('#restTime').removeClass('hidden');
        $('#votedCount').removeClass('hidden');
        $('#votedCount').text(`投票数: 0 / ${playerNum}`)
        // タイマースタート
        startTimer(setCount);
        // プレイヤー名クリックで投票者を選択
        for (let id = 0; id < playerNum; id++) {
            $(`#userArea${id}`).click(function(){
                $(`#modalArea${id}`).fadeIn();
            });
            // modalの閉じるボタンクリック時
            $(`#closeModal${id} , #modalBg${id}, #vote${id}`).click(function(){
                $(`#modalArea${id}`).fadeOut();
            });
            // 人狼へ投票
            $(`#vote${id}`).click(function() {
               socket.emit("vote_for_wolfman", id, getRoomId());
            })
        }
        
        // ホバー時の見た目変化
        $('.userArea').hover(function() {
            $(this).css('background',"darkgray");
        }, function() {
            $(this).css('background', '');
        });
        
        
    })
    
    // 追加投票の停止
    socket.on("prohibit_voting", () => {
        $('.modalContents').html("<h1>既に投票済みです</h1>")
    })
    
    // 投票数の変更をプレイヤーに通知
    socket.on("changeVotedCount", (current, total) => {
        $("#votedCount").text(`投票数: ${current} / ${total}`)
    })
    
    // 投票終了後、結果表示ボタンを押せるようにする
    socket.on("finished_voting", () => { 
        $('#result').removeClass("limitted")
        $('#result').on("click", () => {
            socket.emit("request_result", getRoomId());
        })
    });
    
    socket.on("request_your_sessionId", () => {
        
        let roomId =  getRoomId();
        let cookie = getCookieArray();
        let sessionId = cookie["sessionId"];
        
        socket.emit("response_my_sessionId", roomId, sessionId);
    })
    
    // ゲーム結果を表示
    socket.on("game_result", (result, details) => {
        console.log(result);
        console.log(details);
        $('#modalArea').fadeIn();
        $('#modalContents').empty();
        $('#modalContents').append(`<h1 id="gameResult">${result}</h1>`);
        $('#modalContents').append(`<p id="details">${details}</p>`);
        $('#closeModal , #modalBg').on('click', () => {
            $('#modalArea').fadeOut();
        });
    })

});
