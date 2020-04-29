 /*----------------------------------------------------------------------------
 バグ修正ログ
 
 *thief/fortune実行時にポインタが消えるバグ修正　line 239,247
 リプレイ時にtheif/fortuneのアクションボタンが機能しなくなるがあったから
 line 246, 277に"$('.card').css('pointer-events',  'auto');"追加したよ
 ↑問題あれば言ってね！
 
 ----------------------------------------------------------------------------*/

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
    return (result[1] != "") ? true : false;
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
    $('body').removeClass('date');
    $('body').removeClass('night');
    $('body').addClass('initial');
    $('.userArea').css('cursor', '');
    $('#toNight').removeClass("disabled");
    $('#toDate').addClass('disabled');
    $('#result').addClass('disabled');
    $('#modalArea').fadeOut();
    $('#restTime, #votedCount, .card').text("");
    $('.vote').removeClass("hidden");
    $('.votedPlayer').removeClass("hidden");
    $('.attention').addClass('hidden');
}
// 夜フェーズ画面表示
function night () {
    $('.userArea').css('pointer-events', 'auto');
    $('#toNight').addClass('disabled');
    $('#toDate').removeClass('disabled');
    $('#result').addClass('disabled');
    $('body').removeClass('initial');
    $('body').addClass('night');
    $('#plate').addClass('nightPlate');
}
function date () {
    $('body').css('background-color', 'none');
    $('body').removeClass('night');
    $('body').addClass('date');
    $('.userArea, .cemetaryArea').off();
    $('#toDate').addClass('disabled');
    $('#toNight').addClass('disabled');
    $('#restTime').removeClass('hidden');
    $('#votedCount').removeClass('hidden');
    
        // ポインターイベントの変更処理
    $('.userArea').css('pointer-events', 'auto');
    $('.userArea').css('cursor', 'pointer');
    $('.userArea, .cemetaryArea').children('img').attr('src', './images/cards/card.png');
    
    // ホバー時の見た目変化
    $('.userArea').hover(function() {
        $(this).css('background',"darkgray");
    }, function() {
        $(this).css('background', '');
    });
    
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
    let cookie = getCookieArray();
    let accessRight;
    
    accessRight = cookie["accessRight"]
    
    // roomページへのアクセス権がある時だけ以下の処理
    // if (isRoomPage()) {
    if (isRoomPage() && accessRight == 1) {
        // let cookie = getCookieArray();
        let roomId = getRoomId();
        let sessionId = cookie["sessionId"];
        initial();
        // 自分がmasterかどうかをサーバーに問い合わせ
        socket.emit("i_am_master?", roomId, sessionId);
        
        // socketに部屋番号に応じたルームを作成
        socket.emit('joinRoom_from_client', {
            roomId: roomId, 
            sessionId: sessionId
        });
        
        // 夜へボタンを押した時
        $('#toNight').on('click', () => {
            $('#toNight').off();
            // 昼へボタンのクリックアクションを有効化
            $('#toDate').on('click', () => {
                $('#toDate').off();
                socket.emit("day_begins", roomId);
            })
        
            socket.emit('toNightClicked', roomId);
        });
    }
    // masterではない場合、フェーズボタンを非表示
    socket.on("master_or_not", (flag) => {
        if (flag == 0) {
            // $('#toNight, #toDate, #result').addClass("hidden");
            $('.operation').addClass("hidden");
        }
    });

    // 新しいクライアント入室をトリガにページリロード
    socket.on('new_client_join', () => {
        window.location.reload();
    });
    
    // 自分のsessionIdでサーバに自分のプレイヤー情報問い合せ
    socket.on('roles_asigned', ()=> {
        let roomId = getRoomId();
        let cookie = getCookieArray();
        let sessionId = cookie["sessionId"];
        
        // 状態を夜に変更
        night();
        socket.emit('request_role', roomId, sessionId);
    });
    
    // 自分のフィールドに役職表示、自分の役職をサーバに通知
    socket.on('give_role', data => {
        $(`#card${data.playerNo}`).attr('src', `./images/cards/${data.userRole}.png`);

        // 自分の役職のメソッドをサーバに要求する
        switch (data.userRole) {
            case 'wolfman':
                socket.emit('i_am_wolfman', getRoomId());
                socket.on('all_wolfman', wolfmanList => {
                    wolfmanList.forEach( wolfmanInfo => {
                        $(`#card${wolfmanInfo.playerNo}`).attr('src', './images/cards/wolfman.png');
                    }  );
                });
                break;
                
            case 'fortune':
                
                console.log("fortune");
                // ポインターイベントの変更処理
                // $('.userArea').css('pointer-events', 'auto');
                $('.userArea, .cemetaryArea').css('pointer-events', 'auto');
                // 役職持ちのボタンがリプレイ以降使えるようにする
                // $('.card').css('pointer-events',  'auto');

                // ホバー時の見た目変化
                $('.userArea, .cemetaryArea').hover(function() {
                    $(this).css('background',"darkgray");
                    $(this).css('cursor',"pointer");
                }, function() {
                    $(this).css('background', '');
                    $(this).css('cursor',"");
                });
                $(`#userArea${data.playerNo}`).css('pointer-events',  'none');
                
                // fortuneメソッドの実行
                // $('.card').click( (e) => {
                $('.userArea, .cemetaryArea').one('click', (e) => {
                    let numPosition = e.currentTarget.id.indexOf("Area") + 4;
                    let targetNo = parseInt(e.currentTarget.id.substr(numPosition));
                    // $('.card').css('pointer-events',  'none');
                    $('.userArea, .cemetaryArea').css('pointer-events',  'none');
                    console.log(targetNo);
                    socket.emit('i_am_fortune', getRoomId() ,targetNo);
                    socket.on('fortune_result', fortuneResult => {
                        fortuneResult.forEach( result => {
                            $(`#card${result.playerNo}`).attr('src', `./images/cards/${result.userRole}.png`);
                        } );
                    });
                        $('.userArea, .cemetaryArea').off('click');
                    // ポインター解除
                    $(`.userArea, .cemetaryArea`).css('pointer-events',  'none');
                });
                break;
                
                
            case 'thief':
                // ポインターイベントの変更処理
                $('.userArea').css('pointer-events', 'auto');
                // 役職持ちのボタンがリプレイ以降使えるようにする
                // $('.card').css('pointer-events',  'auto');
                // ホバー時の見た目変化
                $('.userArea').hover(function() {
                    $(this).css('background',"darkgray");
                    $(this).css('cursor',"pointer");
                }, function() {
                    $(this).css('background', '');
                    $(this).css('cursor',"");
                });
                $(`#userArea${data.playerNo}`).css('pointer-events',  'none');
                
                // thiefメソッドの実行
                // $('.card').click( (e) => {
                $('.userArea').one('click', (e) => {
                    let thiefNo = data.playerNo;
                    let numPosition = e.currentTarget.id.indexOf("Area") + 4;
                    let targetNo = parseInt(e.currentTarget.id.substr(numPosition));
                    // $('.card').css('pointer-events',  'none');
                    console.log(`${data.userName}の怪盗アクション発火されてます`);
                    $('.userArea').css('pointer-events',  'none');
                    
                    socket.emit('i_am_thief', getRoomId() ,targetNo, thiefNo);
                    socket.on('thief_result', thiefResult => {
                        thiefResult.forEach( result => {
                            $(`#card${result.playerNo}`).attr('src', `./images/cards/${result.userRole}.png`);
                        } );
                    });
                    socket.once("are_you_thief", () => {
                       socket.emit("thief_action", getRoomId(), targetNo, thiefNo); 
                    });
                    
                    $('.userArea, .cemetaryArea').off('click');
                    // ポインター解除
                    $(`.userArea, .cemetaryArea`).css('pointer-events',  'none');
                });
                break;
            
            default:
                // code
        }
    });
    
    // 昼のスタート
    socket.on("notice_day_started", (playerNum) => {
        // タイマーの秒数を設定
        console.log("days start!")
        let setCount = 5;
        // 画面状態を昼に変更
        date();
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
            $(`#vote${id}`).on('click', () => {
               socket.emit("vote_for_wolfman", id, getRoomId());
            //   $(`#vote${id}`).off();
            })
        }
        
    })
    
    // 追加投票の禁止
    socket.on("prohibit_voting", () => {
        $('.attention').removeClass('hidden');
        $('.votedPlayer').addClass("hidden");
        $('.vote').addClass("hidden");
        $(".vote").off();
    })
    
    // 投票数の変更をプレイヤーに通知
    socket.on("changeVotedCount", (current, total) => {
        $("#votedCount").text(`投票数: ${current} / ${total}`);
    })
    
    // 投票終了後、結果表示ボタンを押せるようにする
    socket.on("finished_voting", (playerNum) => { 
         $('#result').removeClass("disabled");
        // 各ユーザー投票ボタンのクリックアクションの停止
        for(let id=0; id<playerNum;id++) {
            $(`#userArea${id}`).off();
        }
        
        $('#result').on("click", () => {
            $('#result').off();
            socket.emit("request_result", getRoomId());
        });
    })
    
    socket.on("request_your_sessionId", () => {
        
        let roomId =  getRoomId();
        let cookie = getCookieArray();
        let sessionId = cookie["sessionId"];
        
        socket.emit("response_my_sessionId", roomId, sessionId);
    })
    
    // ゲーム結果を表示
    socket.on("game_result", (result, details, flag) => {
        console.log(result);
        console.log(details);
        $('#modalArea').fadeIn();
        $('#modalContents').empty();
        $('#modalContents').append(`<h1 id="gameResult">${result}</h1>`);
        $('#modalContents').append(`<p id="details">${details}</p>`);
        $('#closeModal , #modalBg').on('click', () => {
            $('#modalArea').fadeOut();
        });
        $('#result').on('click', () => {
            $('#modalArea').fadeIn();
        })
        
        // masterユーザーの場合Replayボタンの設置
        if (flag == 1) {
            $('#modalContents').append('<button id="replay">Replay?</button> ');
            $('#replay').on('click', () => {
                socket.emit("request_replay", getRoomId());
            })
        }
    })
    
    // 画面表示の初期化
    socket.on("initializeHTML", () => {
        
        // 画面をinitialに戻す
        initial();
        
        // クリックアクションの初期化
        $('#result').off('click');
        $('.userArea, .cemetaryArea').off('click');
        $('#toNight').on('click', () => {
            
            $('#toNight').off();
            $('#toNight').addClass("disabled");
            $('#toDate').removeClass("disabled")
            $('#toDate').on('click', () => {
                $('#toDate').off();
                $('#toDate').addClass("disabled");
                socket.emit("day_begins", getRoomId());
            })
            socket.emit('toNightClicked', getRoomId());
        });
    })
    
});
