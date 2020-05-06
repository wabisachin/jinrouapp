 /*----------------------------------------------------------------------------
 
                  関数定義
 
 ----------------------------------------------------------------------------*/
 
 
 /*---------------------------リンセーへ----------------------------------------
 app.jsの中で使いたい関数はここに書いてね。基本的に下に書いてる感じで書いてけば
 Okなんだけど、注意点としては関数の最後に","がいる(例１)ことを忘れないでね。
 (module.exportsはkey=>関数名, value =>関数のディクショナリ形式になってる)
 あともう一つは関数内で定義した関数を他の関数の中で使いたいときthisが必要だから
 注意してね(例２）。
 
 <例1>
 
 関数名: function (引数１, 引数2) {
   処理の内容
 },     (←このコンマを忘れない！)
 
 <例2>
module.exports = {
   func1: function() {
     -処理内容
   }
   
   func2: function() {
     let x = this.func1()  (⇦関数名の前にthisが必要)
   }
}
 --------------------------------リンセーへ-----------------------------------*/
       
 module.exports = {
   
//  sessionと[セッション番号、ユーザー名]のディクショナリ追加
  userAdd: function(field, sessionId, userName){
    if (field.currentPlayerNum < field.playerNum - 1) {
      field.players[sessionId] = {
        playerNo:  field.currentPlayerNum, 
        userName: userName,
        userRole: "",
        master: 0,
        socketId: "",
        votedCount: 0,
        flag: 0, //直近の更新が手動or自動リロードかを判別するフラグ
      };
      // 最初にroomに入室したユーザーにmasterを付与
      if (field.currentPlayerNum == 0) {
        field.players[sessionId].master = 1;
      } 
      field.currentPlayerNum++;
    } 
    else if (field.currentPlayerNum === field.playerNum - 1) {
    // 最後の一人が入った後に墓地ユーザ追加
      field.players[sessionId] = {
        playerNo:  field.currentPlayerNum, 
        userName: userName,
        userRole: "",
        master: 0,
        votedCount: 0,
        flag: 0, //直近の更新が手動or自動��ロードかを判別するフラグ
      };
      
      //墓地ユーザ追加
      for (var i = 1; i < 3; i++) {
        field.players[`cemetary${i}`] = {
          playerNo: -i,
          userName: '無投票',
          votedCount: 0,
          flag: 0
        };
      }
      // console.log(field.players);
      field.currentPlayerNum++;
    }
    
    else {
      //プレイヤー数以上のアクセスが有った場合の処理
    }

  },
  
  userDelete: function(room, roomId, sessionId) {
    delete room[roomId]["players"][sessionId];
    delete room[roomId]["players"]["cemetary1"];
    delete room[roomId]["players"]["cemetary2"];
  },
      
  
  //ユーザのブラウザにCookie保存する
  setCookie: function(key, value, res) {
    const escapedValue = escape(value);
    res.setHeader('Set-Cookie', [`${key}=${escapedValue}`]);
    // res.cookie(key, value);
  },
  
  // cookieに保存されたキーから値を取得
  getCookie: function (key, request) {
    const cookieData = request.headers.cookie !== undefined ? request.headers.cookie : '';
    const datas = cookieData.split(';').map(data => data.trim());
    const msgKeyValue = datas.find(data => data.startsWith(`${key}=`));
    if (msgKeyValue === undefined) return '';
    const msgValue = msgKeyValue.replace(`${key}=`, '');
    return unescape(msgValue);
},

  // 遷移先のroomの参加playerリストにsessionIdが登録されているか
  verificateSessionId: function(room, sessionId , roomId, request) {
    for (let id in room[roomId]["players"]) {
      if (id == sessionId) {
        return true;
      }
    }
    return false;
  },
  // ルームが存在するかどうかのcheck
  checkRoomExisting: function (room, roomId) {
    for (let id in room) {
      if (id == roomId) {
        return true;
      }
    }
    return false;
  },
  
  // ルームの参加人数に空きがあるかどうか
  canIRoomIn: function(room, roomId, HTTP_method) {
    let num = (HTTP_method == "get") ? 1 : 0;
    let currentPlayerNum =  room[roomId]["currentPlayerNum"];
    let playerNum =  room[roomId]["playerNum"];
    return (currentPlayerNum >= playerNum + num) ? false : true;
  },
  
  // // ルームの解散
  // function dissolveRoom(roomId) {
    
  // }
  // // socketIdからプレイヤー名を取得
  // function getPlayerName(socketId) {
  //   let name;
    
  //   for (let roomId in room) {
  //     for (let sessionId in room[roomId]["players"]) {
  //       if (room[roomId]["players"]["sessionId"]["socketId"] == socketId)
  //       name =  room[roomId]["players"]["sessionId"]["userName"]
  //     }
  //   }
  //   return name;
  // }
  // 切断ユーザーの検知
  disconnectedPlayer: function(room, socketId) {
    let rooms = [];
    let sessionId;
    let playerName;
    
    for (let roomId in room) {
      for (let session in room[roomId]["players"]) {
        if ( room[roomId]["players"][session]["socketId"] == socketId) {
          rooms.push(roomId);
          sessionId = session;
          playerName =  room[roomId]["players"][session]["userName"]
        }
      }
    }
    return {rooms: rooms, sessionId: sessionId, playerName: playerName}
  },


  // カードをシャッフルする。
  randomRole: function(field) {
    let roles = [];
    
    for (var i = 0; i < field.villager; i++) {
      roles.push('villager');
    }
    for (var i = 0; i < field.wolfman; i++) {
      roles.push('wolfman');
    }
    for (var i = 0; i < field.thief; i++) {
      roles.push('thief');
    }
    for (var i = 0; i < field.fortune; i++) {
      roles.push('fortune');
    }
    for (var i = 0; i < field.teruteru; i++) {
      roles.push('teruteru');
    }
    for(let i = roles.length - 1; i > 0; i--){
      let r = Math.floor(Math.random() * (i + 1));
      let tmp = roles[i];
      roles[i] = roles[r];
      roles[r] = tmp;
    }
    return roles;
  },
  
  // field内のplayersディクショナリにroleを入れていく
  roleAsign: function(field, roles) {
      Object.keys(field.players).forEach(key => {
        field.players[key]["userRole"] = roles.pop() ;
      });
      // console.log(field.players);
  },
  
  // 自分以外のプレイヤーのflagを０→１に変更。(flagは自動/手動リロードの判定)
  changeOthersFlag: function(players, sessionId) {
    for (let key in players) {
        if (key == sessionId) { 
          continue
        }
        players[key]["flag"] = 1;
      }
  },
  
  // 人狼メソッド：全人狼のplayer{}を返す
  wolfman: function(room, roomId) {
    let wolfmanList = Object.values(room[roomId].players).filter(x => x.userRole === 'wolfman');
    // console.log(wolfmanList);
    return wolfmanList;
  },
  
  // 占い師メソッド：選択したカードの役職を通知、墓地カードの場合両方通知
  fortune: function(room, roomId, targetNo){
    let fortuneResult = [];
    if (targetNo >= 0) {
      fortuneResult = Object.values(room[roomId].players).filter(x => x.playerNo === targetNo);
    } else {
      fortuneResult = Object.values(room[roomId].players).filter(x => x.playerNo < 0);
    }
    return fortuneResult;
  },
  
  // 怪盗メソッド1：選択したカードがなにかを教える
  thiefBefore: function (room, roomId, targetNo, thiefNo) {
    let players = room[roomId].players;
    let thiefResult = Object.values(players).filter(v => v.playerNo === targetNo );
    return thiefResult;
  },
  
  // 怪盗メソッド2：昼になったら役職を交換する
  thiefAfter: function(room, roomId, targetNo, thiefNo) {
    let players = room[roomId].players;
    console.log("交換前");
    console.log(players);
    let stealId = Object.keys(players).filter(k => players[k].playerNo === targetNo || players[k].playerNo === thiefNo );
    let temp = players[stealId[0]].userRole;
    players[stealId[0]].userRole = players[stealId[1]].userRole;
    players[stealId[1]].userRole = temp;
    console.log("交換後");
    console.log(players);
  },
  
  // 投票メソッド：投票されたプレイヤーを受け取り,データベースに結果を反映
  voteForPlayers: function(room, selectedNo, room_id) {

    let players = room[room_id]["players"];
    
    // 投票数のカウント
    room[room_id]["currentVotedCount"]++;
    for (let key in players) {
      if (players[key]["playerNo"] == selectedNo) {
        players[key]["votedCount"]++;
      }
    }
  },
  
  // 最も多く投票されたユーザーのsessionIdを配列として返す
  getMostVoted: function(room, roomId) {

    let players = room[roomId]["players"];
    let max_voted_players = [];
    let max_count = 0;
    
    // 投票された数が最も多かったプレイヤーのsessionIdを配列に格納
    for (let key in players) {
      if (players[key]["votedCount"] > max_count) {
        max_count = players[key]["votedCount"];
        max_voted_players = [];
        max_voted_players.push(key);
      }
      else if (players[key]["votedCount"] == max_count) {
        max_voted_players.push(key);
      }
      else {
        continue;
      }
    }
    return max_voted_players;
  },
  
  //平和村(人狼が一人もいない状態)かどうかの判定
  // 村の種類の判定
  // function 
  // isPeaceVillage(roomId) {
  kindOfVillage: function(room, roomId) {
    const peaceVillage = 0;
    const wolfVillage = 1;
    const teruteruVillage = 2;
    const wolfteruVillagerVillage = 3;
    const wolfteruVillage = 4;
    
    let players = room[roomId]["players"];
    
    // for (let key in players) {
      // if (players[key]["userRole"] == "wolfman" && players[key]["playerNo"] >= 0) {
      if (this.findRole(players, "wolfman") && this.findRole(players, "teruteru") && this.findRole(players, "villager")) {
        return wolfteruVillagerVillage;
      } else if (this.findRole(players, "wolfman") && this.findRole(players, "teruteru")) {
        return wolfteruVillage;
      } else if (this.findRole(players, "wolfman")){
        return wolfVillage;
      } else if (this.findRole(players, "teruteru")){
        return teruteruVillage;
      } else {
        return peaceVillage;
      }
    // }
    // return true;
  },
  
  // プレイヤーに役職がいるかの判定
  findRole: function(players, role){
    let temp = Object.values(players).filter(x => x.userRole == role && x.playerNo >= 0);
    if (temp.length != 0){
      return true;
    } else {
      return false;
    }
  },
  
  
  // 全てのプレイヤーが一票ずつ票を分け合う結果だった場合trueを返す
  noOneVoted: function(room, roomId) {

    let players = room[roomId]["players"];
    
    for (let key in players) {
      if (players[key]["votedCount"] != 0 && players[key]["playerNo"] >= 0) {
        return false;
      }
    }
    return true;
  },
  
  // 渡されたplayerリストの中に人狼がいた場合trueを返す
  // function IncludeWolf(roomId, sessionIds) {
  // 渡されたplayerリストの中にroleがいた場合trueを返す
  includeRole: function(room, roomId, sessionIds, role) {
    
    let players =  room[roomId]["players"];
    
    for (let i= 0; i < sessionIds.length; i++) {
      let id =  sessionIds[i];
      if (players[id]["userRole"] ==  role  && players[id]["playerNo"] >= 0) {
        return true;
      }
    }
    
    return false;
  },
  
  // 勝敗に応じて各プレイヤーをsessionIdごとに振り分け、結果をHashで返す
  setWinner: function(players, winside) {
    
    let result = {win: [], lose: []};
    
    switch (winside) {
      // 村人勝利
      case 0:
        for (let key in players) {
          if ((players[key]["userRole"] == "wolfman" || players[key]["userRole"] == "teruteru" ) && players[key]["playerNo"] >= 0) {
            result["lose"].push(key);
          }
          else if (players[key]["playerNo"] >= 0){
            result["win"].push(key);
          }
        }
        break;
      // 人狼勝利
      case 1:
        for (let key in players) {
          if (players[key]["userRole"] == "wolfman"  && players[key]["playerNo"] >= 0) {
            result["win"].push(key);
          }
          else if (players[key]["playerNo"] >= 0){
            result["lose"].push(key);
          }
        }
        break;
        // テルテル勝利
      case 2:
        for (let key in players) {
          if (players[key]["userRole"] == "teruteru"  && players[key]["playerNo"] >= 0) {
            result["win"].push(key);
          }
          else if (players[key]["playerNo"] >= 0){
            result["lose"].push(key);
          }
        }
        break;
    }
    return result;
  },
  
  // ゲーム結果を返す関数
  getGameResult: function(room, roomId) {
    
    let players = room[roomId]["players"];
    let mostVotedPlayers = [];
    let result = {};
    
    // 最も投票されたプレイヤーのsessionIdを格納
    mostVotedPlayers = this.getMostVoted(room, roomId);
    // 平和村の場合の処理
    // if (isPeaceVillage(roomId)) {
    switch (this.kindOfVillage(room, roomId)) {
      // 平和村の場合
      case 0:
        console.log("******平和村******")
              switch (this.noOneVoted(room, roomId)) {
              // 村人全員勝利
              case true:
                result = this.setWinner(players, 0);
                result["details"] = "村人全員生存";
                break;
              // 村人全員敗北
              case false:
                result = this.setWinner(players, 1);
                result["details"] = "村人全員処刑";
                break;
              }
            break;
      // 人狼村人村の場合
      case 1:
        console.log("******人狼村******")
              switch (this.includeRole(room, roomId, mostVotedPlayers, 'wolfman')) {
               // 村人サイドの勝利
              case true:
                result = this.setWinner(players, 0);
                result["details"] = "村人サイドの勝利";
                break;
              // 人狼サイドの勝利
              case false:
                result = this.setWinner(players, 1);
                result["details"] = "人狼サイドの勝利";
                break;
              }
            break;
      // テルテル村人村の場合
      case 2:
           　  console.log("******テルテル村******")
              switch (this.includeRole(room, roomId, mostVotedPlayers, 'teruteru')) {
               // テルテルサイドの勝利
              case true:
                result = this.setWinner(players, 2);
                result["details"] = "テルテルの勝利";
                break;
              // 村人サイドの勝利
              case false:
                if(this.noOneVoted(room, roomId)){
                  result = this.setWinner(players, 0);
                  result["details"] = "村人サイドの勝利";
                } else {
                  result = this.setWinner(players, 1);
                  result["details"] = "村人全員処刑";
                }
              break;
                  
                }
              
            break;
      // テルテル人狼村人村の場合
      case 3:
              console.log("******テルテル人狼村人村******")
              switch (this.includeRole(room, roomId, mostVotedPlayers, 'teruteru')) {
               // テルテルサイドの勝利
              case true:
                result = this.setWinner(players, 2);
                result["details"] = "テルテルの勝利";
                break;
              case false:
                // 村人サイドの勝利
                if (this.includeRole(room, roomId, mostVotedPlayers, 'wolfman')) {
                  result = this.setWinner(players, 0);
                  result["details"] = "村人サイドの勝利";
                } else{
                  result = this.setWinner(players, 1);
                  result["details"] = "人狼サイドの勝利";
                }
                break;
              }
            break;
      case 4:
              console.log("******テルテル人狼村******")
              switch (this.includeRole(room, roomId, mostVotedPlayers, 'teruteru')) {
               // テルテルサイドの勝利
              case true:
                result = this.setWinner(players, 2);
                result["details"] = "テルテルの勝利";
                break;
              case false:
                // 人狼サイドの勝利
                  result = this.setWinner(players, 1);
                  result["details"] = "人狼サイドの勝利";
                break;
                }
              
            break;
        
      default:
        // code
    }
    // (isPeaceVillage(roomId)) {
      // switch (isOneVoted(roomId)) {
      //   // 村人全員勝利
      //   case true:
      //     result = setWinner(players, 0);
      //     result["details"] = "村人全員生存";
      //     break;
      //   // 村人全員敗北
      //   case false:
      //     result = setWinner(players, 1);
      //     result["details"] = "村人全員処刑";
      //     break;
      // }
    // }
    // // 平和村でない場合の処理
    // else {
    //   // switch (IncludeWolf(roomId, mostVotedPlayers)) {
    //   //   // 村人サイドの勝利
    //   //   case true:
    //   //     result = setWinner(players, 0);
    //   //     result["details"] = "村人サイドの勝利";
    //   //     break;
    //   //   // 人狼サイドの勝利
    //   //   case false:
    //   //     result = setWinner(players, 1);
    //   //     result["details"] = "人狼サイドの勝利";
    //   //     break;
    //   // }
    // }
    return result;
  },
  
  //変数の初期化(Replay時)
  initialize: function(room, roomId) {
    
    let players =  room[roomId]["players"];
    
    // 値の初期化
    room[roomId]["currentVotedCount"] = 0;
    room[roomId]["currentActionCount"] = 0;
    for (let id in players) {
      players[id]["userRole"] = "";
      players[id]["votedCount"] = 0;
    }
  },
  
  setMasterInfo: function(room){
        let rooms = Object.keys(room);
        let masters = {};
          
          rooms.forEach(roomId => {
          let roomInfo = {}
          roomInfo['masterName'] = Object.values(room[roomId].players)[0].userName;
          roomInfo['playerNum'] = room[roomId].playerNum;
          roomInfo['currentPlayerNum'] = room[roomId].currentPlayerNum;
          masters[roomId] = roomInfo;
        });
        return masters;
  }
  
}
