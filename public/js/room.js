 /*----------------------------------------------------------------------------
 バグ修正ログ
 
 ----------------------------------------------------------------------------*/

'use strict';

 /*----------------------------------------------------------------------------
 
                  グローバル変数定義
 
 ----------------------------------------------------------------------------*/


// 設定値を初期化
let playerNum = 0;
let villager = 0;
let wolfman = 0;
let thief = 0;
let fortune = 0;

//  /*----------------------------------------------------------------------------
 
//                   関数定義
 
//  ----------------------------------------------------------------------------*/

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
    let resetFlag = 0;
    let countDown = function() {
        // タイマーを停止して関数から抜ける処理
        if (resetFlag == 1) {
            return false;
        }
        $('#restTime').text(`Time: ${Math.floor(time/60)}分${time%60}秒`);
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
    // 結果発表時にタイマーの停止
    $('.vote').on('click', () =>  {
        resetFlag = 1;
    })
}

function getUserName(finalState, i){
    let voteTo = finalState[i].voteTo;
    if (voteTo >= 0) {
        return finalState[voteTo].userName
    } else {
        return "無投票";
    }
    
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
    // $('#modalArea').fadeOut();
    $('#modalArea').modal('hide');
    $('#restTime, #votedCount, .card').text("");
    $('.vote').removeClass("hidden");
    $('.votedPlayer').removeClass("hidden");
    $('.attention').addClass('hidden');
    $('#modalCemetary').off();
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
    $('.userArea, .cemetaryArea').css('pointer-events', 'auto');
    $('.userArea, .cemetaryArea').css('cursor', 'pointer');
    $('.userArea, .cemetaryArea').children('img').attr('src', './images/cards/card.png');
    
    // ホバー時の見た目変化
    $('.userArea, .cemetaryArea').hover(function() {
        $(this).css('background',"darkgray");
    }, function() {
        $(this).css('background', '');
    });
    
}

 /*----------------------------------------------------------------------------
 
                  Vue.js
 
 ----------------------------------------------------------------------------*/
 //部屋作成の設定値の審査
// var app = new Vue({
//   el: '#settings',
//   data: { 
//     //   役職の初期値設定
//     playerNum: 3,
//     villager: 1,
//     wolfman: 2,
//     thief: 1,
//     fortune: 1,
//     teruteru: 0,
// },
//   computed: {
//     total: function(){
//         return this.villager + this.wolfman + this.thief + this.fortune + this.teruteru
//     }
//   }

//   });
  
 /*----------------------------------------------------------------------------
 
                  ページ動作
 
 ----------------------------------------------------------------------------*/
            
$(function(){

    console.log("room")
    let socket = io.connect();
    let cookie = getCookieArray();
    // let accessRight;
    
    // accessRight = cookie["accessRight"];
    
    // roomページへのアクセス権がある時だけ以下の処理
    
    // if (accessRight == 1) {
    //     let roomId = getRoomId();
    //     let sessionId = cookie["sessionId"];
    //     initial();
    //     // 自分がmasterかどうかをサーバーに問い合わせ
    //     socket.emit("i_am_master?", roomId, sessionId);
        
    //     // socketに部屋番号に応じたルームを作成
    //     socket.emit('joinRoom_from_client', {
    //         roomId: roomId, 
    //         sessionId: sessionId
    //     });
    // }
    
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
    
    // サーバーがリセットされた時
    socket.on("server_reseted!", () => {
        window.location.replace(`/?reason=reboot`);
    })
    
    // masterではない場合、フェーズボタンを非表示
    socket.on("master_or_not", (startFlag, masterFlag) => {
        
        let roomId = getRoomId();
        
        if (masterFlag == 0) {
            // $('#toNight, #toDate, #result').addClass("hidden");
            $('.operation').addClass("hidden");
        }
        
        else if (startFlag ==  0 && masterFlag == 1) {
            $('#toNight').on('click', function() {
                alert("まだ人数が揃っていません。")
            })
        }
        else if (startFlag ==  1 && masterFlag == 1) {
            $('#toNight').off();
            // プレイ人数が上限に達したら夜へボタンを有効か
            $('#toNight').on('click', () => {
                $('#toNight').off();
                // // 昼へボタンのクリックアクションを有効化
                // $('#toDate').on('click', () => {
                //     $('#toDate').off();
                //     socket.emit("day_begins", roomId);
                // })
            
                socket.emit('toNightClicked', roomId);
            });
        }
    });

    // 新しいクライアント入室をトリガにページリロード
    socket.on('new_client_join', () => {
        window.location.reload();
    });
    
    // プレイヤーがゲームを退出した時
    socket.on('playerLeaving!', (name) => {
        console.log("dissolved!")
        // クエリパラメータにページ遷移理由を記載(alert表示で利用)
        window.location.replace(`/?reason=leaving&name=${name}`);
    })
    
    // masterによってルームが解散された時
    socket.on('room_dissolved!', () => {
        console.log("dissolved!")
        // クエリパラメータにページ遷移理由を記載(alert表示で利用)
        window.location.replace(`/?reason=dissolved`);
    })
    
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
        
        let masterFlag = data["master"];
        
        $(`#card${data.playerNo}`).attr('src', `./images/cards/${data.userRole}.png`);
        // master以外にアクション済みボタンの表示
        if (masterFlag == 0) {
            $('#ready').removeClass('hidden');
            $('#ready').on('click', function() {
                $('#ready').addClass('hidden');
                socket.emit("I_am_ready", getRoomId());
            })
        }
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
    
    // 昼フェーズへの移行許可
    socket.on("permit_moving_to_date", (roomId) => {
        // 昼へボタンのクリックアクションを有効化
        $('#toDate').on('click', () => {
            $('#toDate').off();
            socket.emit("day_begins", roomId);
        })
    })
    
    // 昼のスタート
    socket.on("notice_day_started", (playerNum) => {
        // タイマーの秒数を設定
        console.log("days start!")
        let setCount = 300;
        let sessionId = cookie["sessionId"];
        // 画面状態を昼に変更
        date();
        $('#votedCount').text(`投票数: 0 / ${playerNum}`)
        // タイマースタート
        startTimer(setCount);
        // プレイヤー名クリックで投票者を選択
        for (let id = 0; id < playerNum; id++) {
            $(`#userArea${id}`).click(function(){
                // $(`#modalArea${id}`).fadeIn();
                $(`#modalArea${id}`).modal('toggle');
            });
            // modalの閉じるボタンクリック時
            // $(`#closeModal${id} , #modalBg${id}, #vote${id}`).click(function(){
            //     // $(`#modalArea${id}`).fadeOut();
            //     $(`#modalArea${id}`).modal('hide');
            // });
            // 人狼へ投票
            $(`#vote${id}`).on('click', () => {
               socket.emit("vote_for_wolfman", id, getRoomId(), sessionId );
            //   $(`#vote${id}`).off();
            })
        }
        $('.cemetaryArea').click(function(){
            $('#modalCemetary').modal('toggle');
            // 墓地に投票
            $(`#voteCemetary`).on('click', () => {
               socket.emit("vote_for_wolfman", -1, getRoomId(), sessionId );
               console.log('墓地に投票')
            //   $(`#vote${id}`).off();
            })
            
        })
        
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
    socket.on("game_result", (result, details, flag, initialRoles, finalState) => {
        console.log(result);
        console.log(details);
        console.log(finalState);
        // $('#modalArea').fadeIn();
        $('#modalArea').modal('toggle');
        $('#modalContents').empty();
        // $('#modalContents').append(`<h1 id="gameResult">${result}</h1>`);
        $('#modalTitle').text(result);
        $('#modalContents').append(`<p id="details">${details}</p>`);
        $('#modalContents').append(`<div>開始時のカード状態</div>`);
        $('#modalContents').append(`<div class="field" id="initialModalField"></div>`);
        for (var i = 0; i < initialRoles.length - 2; i++) {
            $('#initialModalField').append(`<div class="modalInitialUserArea" id="initialModalUserArea${i}"></div>`)
            $(`#initialModalUserArea${i}`).append(`<div class="modalUserName">${finalState[i].userName}</div>`);
            $(`#initialModalUserArea${i}`).append(`<img src=./images/cards/${initialRoles[i]}.png class="modalCard"></img>`);
        }
        $('#modalContents').append(`<div>終了時のカード状態</div>`);
        $('#modalContents').append(`<div class="field" id="finalModalField"></div>`);
        for (var i = 0; i < finalState.length - 2; i++) {
            $('#finalModalField').append(`<div class="modalUserArea" id="finalModalUserArea${i}"></div>`)
            $(`#finalModalUserArea${i}`).append(`<div class="modalUserName">${finalState[i].userName}</div>`);
            $(`#finalModalUserArea${i}`).append(`<img src=./images/cards/${finalState[i].userRole}.png class="modalCard"></img>`);
            $(`#finalModalUserArea${i}`).append('<div class="modalUserName">投票先</div>');
            $(`#finalModalUserArea${i}`).append(`<div class="modalUserName">${getUserName(finalState, i)}</div>`);
            
        }
        $('#modalContents').append(`<div>墓地</div>`);
        $('#modalContents').append(`<div class="field" id="cemetaryModalField"></div>`);
        for (var i = initialRoles.length - 2; i < initialRoles.length ; i++) {
        $('#cemetaryModalField').append(`<img src=./images/cards/${initialRoles[i]}.png class="modalCard"></img>`);
        }
        
        // $('#modalContents').append(`<p id="details">${details}</p>`);
        // $('#closeModal , #modalBg').on('click', () => {
        //     // $('#modalArea').fadeOut();
        //     $('#modalArea').modal('hide');
        // });
        $('#result').on('click', () => {
            // $('#modalArea').fadeIn();
            $('#modalArea').modal('toggle');
        })
        
        // masterユーザーの場合Replayボタンの設置
        if (flag == 1) {
            $('#modalContents').append('<button id="replay" type="button" class="btn btn-success">もう一度遊ぶ</button> ');
            $('#modalContents').append('<button id="quit" type="button" class="btn btn-success">ゲームを終了</button> ');
            $('#replay').on('click', () => {
                socket.emit("request_replay", getRoomId());
            })
            
            $('#quit').on('click', () => {
                socket.emit("quitGame", getRoomId());
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
        $('#toDate').off();
        $('#toNight').on('click', () => {
            
            $('#toNight').off();
            $('#toNight').addClass("disabled");
            $('#toDate').removeClass("disabled")
            // $('#toDate').on('click', () => {
            //     $('#toDate').off();
            //     $('#toDate').addClass("disabled");
            //     socket.emit("day_begins", getRoomId());
            // })
            socket.emit('toNightClicked', getRoomId());
        });
    })
    
    socket.on("admin", () => {
        window.location.replace(`/?reason=Serverエラー`);
    });
    
});
