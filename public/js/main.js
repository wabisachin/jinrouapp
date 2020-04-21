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


//Vue.jsの設定、カードの合計枚数によって部屋作成ボタンを表示
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
            
$(function(){

    let socket = io.connect();
    
    console.log(document.cookie);
    
        // 夜へボタンを押した時
    $('#toNight').on('click', () => {
        socket.emit('toNightClicked');
    });
    
    socket.on('roles_from_server', roles => {
        for (var i = 0; i < roles.length; i++) {
            $(`#card${i+1}`).text(roles[i]);
        }
        
    })

    socket.on('join_from_server', data => {
        // player名の変更
        $(`#name${data.num}`).text(data.name);
        // フォームを非表示
        $(`#userName${data.num}`).css("display", "none");
    })
    

    });




