 /*----------------------------------------------------------------------------
 バグ修正ログ
isOneVoted関数のif分条件に"players[key]["playerNo"] > 0"を追加。平和村の時に正しい結果出ないバグは
playersの中の墓地フィールドの投票数もカウントしてたのが原因だったわ！

 
 ----------------------------------------------------------------------------*/

 /*----------------------------------------------------------------------------
 
                  Node.jsのrequire
 
 ----------------------------------------------------------------------------*/

    let express = require("express"),
        app = express(),
        server = require("http").Server(app),
        io  =   require('socket.io')(server),
        session = require("express-session"),
        morgan = require("morgan"),
        favicon = require('serve-favicon'),
        path = require('path');
        
        // room.jsにまとめられたルームページの実行ファイルを読み込み
        // roomModule = require('./room.js');
        // redis = require("redis"), 
        // client = redis.createClient(6379, 'redis');
        // client = redis.createClient();
 
 /*----------------------------------------------------------------------------
 
                  グローバル変数定義
 
 ----------------------------------------------------------------------------*/
    // roomには
    
    let room = {}
 

 /*----------------------------------------------------------------------------
 
                  Expressの設定
 
 ----------------------------------------------------------------------------*/
      server.listen(8080, 'localhost');
      
      //テンプレートはviewsフォルダに保存
      app.set('views', __dirname + '/views');
      app.set('view engine', 'ejs');
      
      //middleware
      app.use(express.json());
      app.use(morgan('dev'));
      app.use(favicon(path.join(__dirname, 'public', './images/favicon.ico')));
      app.use(express.urlencoded({extended: true}));//postデータを受け取れるようにするため
      // express-sessionで1時間セッション情報保持
      app.use(session({ 
        secret: 'wabisaRin',
        cookie: { maxAge: 1000 * 60 * 60 },
        resave: false,
        saveUninitialized: true
      }));
      app.use(express.static('public'));
      
      //routing
      
      // トップページ ->アクセスしたときクライアントCookieにセッション保存
      app.get('/', function(req, res){
        setCookie("sessionId", req.session.id, res);
        res.render('index', {
          alert_title: "", 
          alert_message: ""
        });
        console.log(`session: ${req.session.id}`);

      });
      
      // 条件をパスすればroomページへリダイレクト
      app.post('/', function (req, res)  {
        
        let roomId = req.body.roomId;

        //部屋作成の場合
        if(req.body.makeRoom === 'true'){
          
          // もし同じ部屋番号のルームが既にある場合はTopPageへリダイレクト
          if (checkRoomExisting(roomId)) {
            res.render('index', {
              alert_title: "Error", 
              alert_message: "そのルームは既に存在します！"
              
            });
          }
          
          // 同じ部屋番号のルームがない場合は新規作成
          else {
            // fieldの初期化
            let field = { 
                currentPlayerNum :0,
                currentVotedCount:0,
                playerNum : 0,
                villager : 0,
                wolfman : 0,
                fortune : 0,
                thief : 0,
                players : {},
              }
              
            field.playerNum = req.body.playerNum;
            field.villager = req.body.villager;
            field.wolfman = req.body.wolfman;
            field.fortune = req.body.fortune;
            field.thief = req.body.thief;
            
            userAdd(field, req.session.id,req.body.name);
            
            //新規room作成し、fieldを入れる
            room[roomId] = field;
            
            res.redirect(`/${roomId}`);
          }
          
        } 
        //既存ルームに入室する場合
        else {
          // 建てられてない部屋にアクセスした場合
          if (!checkRoomExisting(roomId)) {
            res.render('index', {
              alert_title: "Error", 
              alert_message: "ルームが存在しませんでした。"
              
            });
          }
          // 入室
          else {
            
            userAdd(room[req.body.roomId],req.session.id,req.body.name);
            res.redirect(`/${req.body.roomId}`);
          }
          
        }
      })
      
      // roomページにfieldを渡す
      app.get('/:room_id', function(req, res){
        
        let roomId = req.params.room_id;

        // アクセス制限

        // sessionIdがないのにルームページにアクセスした場合
        if (getCookie("sessionId", req) == '') {
          setCookie("accessRight", 0 , res);
          // indexページをレンダリング
          console.log("indexをrender,,,,,,")
          res.render('index', {
            alert_title: "Error", 
            alert_message: "入室フォームから入室して下さい"
          });
        }
        // 建てられてない部屋にアクセスした場合
        else if (!checkRoomExisting(roomId)) {
          setCookie("accessRight", 0 , res);
          console.log("indexをrender")
          res.render('index', {
            alert_title: "Error", 
            alert_message: "ルームが存在しませんでした"
          });
        }
        // 入室許可
        else {
          setCookie("accessRight", 1 , res);
          // room.jsに分割された実行ファイルを読み込み
          // roomModule();
          console.log("ルームをrender")
          res.render('room', {
            roomId: req.params.room_id,
            field: room[req.params.room_id],
          });
        }
      });
      
      // redisのテストコード
      // client.on("error", function(error) {
      //   console.error(error);
      // });
      // client.get("test", redis.print);
      // client.get("key", redis.print);
      // client.get("misssing-key", function(err, reply) {
      //   // reply is null when the key is missing
      //     console.log(reply);
      // });

  console.log('Server running …');

 /*----------------------------------------------------------------------------
 
                  関数定義
 
 ----------------------------------------------------------------------------*/
 
       
//  sessionと[セッション番号、ユーザー名]のディクショナリ追加
      function userAdd(field, sessionId, userName){
        if (field.currentPlayerNum < field.playerNum - 1) {
          field.players[sessionId] = {
            playerNo:  field.currentPlayerNum, 
            userName: userName,
            userRole: "",
            master: 0,
            votedCount: 0,
            flag: 0, //直近の更新が手動or自動リロードかを判別するフラグ
          };
          // 最初にroomに入室したユーザーにmasterを付与
          if (field.currentPlayerNum == 0) {
            field.players[sessionId].master = 1;
          } 
          field.currentPlayerNum++;
        } else if (field.currentPlayerNum === field.playerNum - 1)
        // 最後の一人が入った後に墓地ユーザ追加
         {
            field.players[sessionId] = {
            playerNo:  field.currentPlayerNum, 
            userName: userName,
            userRole: "",
            master: 0,
            votedCount: 0,
            flag: 0, //直近の更新が手動or自動リロードかを判別するフラグ
          };
          
          //墓地ユーザ追加
          for (var i = 1; i < 3; i++) {
            field.players[`cemetary${i}`] = {
              playerNo: -i,
              userName: 'cemetary' + i,
              flag: 0
            };
          }
          // console.log(field.players);
          field.currentPlayerNum++;
         }
           else {
          //プレイヤー数以上のアクセスが有った場合の処理
          
        }

      }
      
  
  //ユーザのブラウザにCookie保存する
  function setCookie(key, value, res) {
    const escapedValue = escape(value);
    res.setHeader('Set-Cookie', [`${key}=${escapedValue}`]);
  }
  
  // cookieに保存されたキーから値を取得
  function getCookie(key, request) {
    const cookieData = request.headers.cookie !== undefined ? request.headers.cookie : '';
    const datas = cookieData.split(';').map(data => data.trim());
    const msgKeyValue = datas.find(data => data.startsWith(`${key}=`));
    if (msgKeyValue === undefined) return '';
    const msgValue = msgKeyValue.replace(`${key}=`, '');
    return unescape(msgValue);
}
  // ルームが存在するかどうかのcheck
  function checkRoomExisting(roomId) {
    for (let id in room) {
      if (id == roomId) {
        return true;
      }
    }
    return false;
  }


  // カードをシャッフルする。
  function randomRole (field) {
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
    for(let i = roles.length - 1; i > 0; i--){
      let r = Math.floor(Math.random() * (i + 1));
      let tmp = roles[i];
      roles[i] = roles[r];
      roles[r] = tmp;
    }
    return roles;
  }
  
  // field内のplayersディクショナリにroleを入れていく
  function roleAsign (field, roles) {
      Object.keys(field.players).forEach(key => {
        field.players[key]["userRole"] = roles.pop() ;
      });
      // console.log(field.players);
  }
  
  // 自分以外のプレイヤーのflagを０→１に変更。(flagは自動/手動リロードの判定)
  function changeOthersFlag(players, sessionId) {
    for (let key in players) {
        if (key == sessionId) { 
          continue
        }
        players[key]["flag"] = 1;
      }
  }
  
  // 人狼メソッド：全人狼のplayer{}を返す
  function wolfman(roomId) {
    let wolfmanList = Object.values(room[roomId].players).filter(x => x.userRole === 'wolfman');
    // console.log(wolfmanList);
    return wolfmanList;
  }
  
  // 占い師メソッド：選択したカードの役職を通知、墓地カードの場合両方通知
  function fortune(roomId, targetNo){
    let fortuneResult = [];
    if (targetNo >= 0) {
      fortuneResult = Object.values(room[roomId].players).filter(x => x.playerNo === targetNo);
    } else {
      fortuneResult = Object.values(room[roomId].players).filter(x => x.playerNo < 0);
    }
    return fortuneResult;
  }
  
  // 怪盗メソッド1：選択したカードがなにかを教える
  function thiefBefore(roomId, targetNo, thiefNo) {
    let players = room[roomId].players;
    let thiefResult = Object.values(players).filter(v => v.playerNo === targetNo );
    return thiefResult;
  }
  
  // 怪盗メソッド2：昼になったら役職を交換する
  function thiefAfter(roomId, targetNo, thiefNo) {
    let players = room[roomId].players;
    console.log("交換前");
    console.log(players);
    let stealId = Object.keys(players).filter(k => players[k].playerNo === targetNo || players[k].playerNo === thiefNo );
    let temp = players[stealId[0]].userRole;
    players[stealId[0]].userRole = players[stealId[1]].userRole;
    players[stealId[1]].userRole = temp;
    console.log("交換後");
    console.log(players);
  }
  
  // 投票メソッド：投票されたプレイヤーを受け取り,データベースに結果を反映
  function voteForPlayers(selectedNo, room_id) {

    let players = room[room_id]["players"];
    
    // 投票数のカウント
    room[room_id]["currentVotedCount"]++;
    for (let key in players) {
      if (players[key]["playerNo"] == selectedNo) {
        console.log("votedCount");
        players[key]["votedCount"]++;
        console.log(players[key]["votedCount"]);
      }
    }
  }
  
  // 最も多く投票されたユーザーのsessionIdを配列として返す
  function getMostVoted(roomId) {

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
  }
  
  //平和村(人狼が一人もいない状態)かどうかの判定
  function isPeaceVillage(roomId) {

    let players = room[roomId]["players"];
    
    for (let key in players) {
      if (players[key]["userRole"] == "wolfman" && players[key]["playerNo"] >= 0) {
        return false;
      }
    }
    return true;
  }
  
  // 全てのプレイヤーが一票ずつ票を分け合う結果だった場合trueを返す
  function isOneVoted(roomId) {

    let players = room[roomId]["players"];
    
    for (let key in players) {
      if (players[key]["votedCount"] != 1 && players[key]["playerNo"] >= 0) {
        return false;
      }
    }
    return true;
  }
  
  // 渡されたplayerリストの中に人狼がいた場合trueを返す
  function IncludeWolf(roomId, sessionIds) {
    
    let players =  room[roomId]["players"];
    
    for (let i= 0; i < sessionIds.length; i++) {
      let id =  sessionIds[i];
      if (players[id]["userRole"] ==  'wolfman'  && players[id]["playerNo"] >= 0) {
        return true;
      }
    }
    
    return false;
  }
  
  // 勝敗に応じて各プレイヤーをsessionIdごとに振り分け、結果をHashで返す
  function setWinner(players, winside) {
    
    let result = {win: [], lose: []};
    
    switch (winside) {
      // 村人勝利
      case 0:
        for (let key in players) {
          if (players[key]["userRole"] == "wolfman"  && players[key]["playerNo"] >= 0) {
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
    }
    return result;
  }
  
  // ゲーム結果を返す関数
  function getGameResult(roomId) {
    
    let players = room[roomId]["players"];
    let mostVotedPlayers = [];
    let result = {};
    
    // 最も投票されたプレイヤーのsessionIdを格納
    mostVotedPlayers = getMostVoted(roomId);
    // 平和村の場合の処理
    console.log("isOneVoted?");
    console.log(isOneVoted(roomId));
    if (isPeaceVillage(roomId)) {
      switch (isOneVoted(roomId)) {
        // 村人全員勝利
        case true:
          result = setWinner(players, 0);
          result["details"] = "村人全員生存";
          break;
        // 村人全員敗北
        case false:
          result = setWinner(players, 1);
          console.log("setWinner");
          console.log(result);
          
          result["details"] = "村人全員処刑";
          break;
      }
    }
    // 平和村でない場合の処理
    else {
      switch (IncludeWolf(roomId, mostVotedPlayers)) {
        // 村人サイドの勝利
        case true:
          result = setWinner(players, 0);
          result["details"] = "村人サイドの勝利";
          break;
        // 人狼サイドの勝利
        case false:
          result = setWinner(players, 1);
          result["details"] = "人狼サイドの勝利";
          break;
      }
    }
    return result;
  }
  
  //変数の初期化(Replay時)
  function initialize(roomId) {
    
    let players =  room[roomId]["players"];
    
    // 値の初期化
    room[roomId]["currentVotedCount"] = 0;
    for (let id in players) {
      players[id]["userRole"] = "";
      players[id]["votedCount"] = 0;
    }
  }
 /*----------------------------------------------------------------------------
 
                  SocketIOの設定
 
 ----------------------------------------------------------------------------*/

io.sockets.on('connection', socket => {

  // 入室したプレイヤーがmasterであれば1を返す
  socket.on("i_am_master?", (roomId, sessionId) => {
    let flag =  room[roomId]["players"][sessionId]["master"];
    socket.emit("master_or_not", flag);
  })
  
  // toNightボタンがクリックされたらカードシャッフルして役職割当、完了したら通知
  socket.on('toNightClicked', (roomId) => {
    // io.to(roomId).emit('roles_from_server', roleAsign(room[roomId],randomRole(room[roomId])));
    roleAsign(room[roomId],randomRole(room[roomId]));
    io.to(roomId).emit('roles_asigned');
    
    // 初期の役割配布状況を保存する。
    let initialRoles = Object.values(room[roomId].players).map( player => player.userRole);
    room[roomId]['initialRoles'] = initialRoles;
    
    console.log("-------------最初の役割配布状態-------------");
    console.log(room[roomId].initialRoles);
    
  });
  
  // 新しいクライアントが入室したときに部屋の中の他のクライアントのページ更新、roomにjoin
  socket.on("joinRoom_from_client", (data)=> {
    
    let roomId = data.roomId;
    let sessionId = data.sessionId;
    let players = room[roomId]["players"];
    let myFlag = players[sessionId]["flag"];
    
    socket.join(data.roomId);
    // 新規playerがjoinした時だけリロードされるように条件分岐
    if (myFlag == 0){
      changeOthersFlag(players, sessionId);
      socket.broadcast.to(data.roomId).emit('new_client_join');
    }
    else {
      players[sessionId]["flag"] = 0
    }
  })
  
  // 各クライアントの要求をトリガにそれぞれのplayer{}を渡す
  socket.on("request_role", (roomId, sessionId) => {
    socket.emit('give_role', room[roomId].players[sessionId]);
  
    // let role = room[roomId].players[sessionId][2];
    // socket.emit('give_role', role);
  });
  
  // wolfmanのユーザーに他のwolfmanを教える
  socket.on("i_am_wolfman", (roomId) => {
    socket.emit('all_wolfman', wolfman(roomId) );
  });
  
  // fortuneのユーザーに占い結果を教える
  socket.on("i_am_fortune", (roomId, targetNo) => {
    let fortuneResult = fortune(roomId, targetNo);
    socket.emit('fortune_result', fortuneResult);
  });
  
  // 夜に怪盗に交換相手の役職を伝える
  socket.on("i_am_thief", (roomId, targetNo, thiefNo) => {
    let thiefResult = thiefBefore(roomId, targetNo, thiefNo);
    socket.emit('thief_result', thiefResult);
  });
  
  // 昼になった時に怪盗が役職交換実行
  socket.on("thief_action", (roomId, targetNo, thiefNo) => {
  thiefAfter(roomId, targetNo, thiefNo);
  });
  
  // 同一ルームのプレイヤー全員に昼開始の通知、タイマースタート
  socket.on("day_begins", (roomId) => {
    // thiefがいたらthiefAfterの実行
    let playerNum = room[roomId]["playerNum"];
    console.log("days begins!!");
    console.log(room[roomId]["currentPlayerNum"]);
    io.to(roomId).emit("are_you_thief");
    io.to(roomId).emit("notice_day_started", playerNum);
  });
  
  // プレイヤーから投票先を受け取る
  socket.on("vote_for_wolfman", (userNo, roomId) => {
    
    let playerNum = room[roomId]["currentPlayerNum"];
    
    // 選択されたプレイヤーへ投票
    voteForPlayers(userNo, roomId);
    console.log(room[roomId]);
    // 投票数の変更を各プレイヤーに通知
    io.to(roomId).emit("changeVotedCount", room[roomId]["currentVotedCount"], playerNum);
    // 投票後の追加投票を停止
    socket.emit("prohibit_voting");
    // 全ての投票が完了した時の処理
    if (room[roomId]["currentVotedCount"] == playerNum) {
      io.to(roomId).emit("finished_voting", playerNum);
    }
  });
  

  // 結果を各プレイヤーに送信
  socket.on("request_result", (roomId) => {
    // 勝敗の結果を返すためにsessionIdを要求
    io.to(roomId).emit("request_your_sessionId");
    console.log("-------------最初の役割配布状態-------------");
    console.log(room[roomId].initialRoles);
    console.log("-------------最後の役割配布状態-------------");
    console.log(Object.values(room[roomId].players).map( player => player.userRole));
  })
  
  // 各ユーザーに対してゲーム結果を返す
  socket.on("response_my_sessionId", (roomId, sessionId) => {
    
    let gameResult = getGameResult(roomId);
    let result;
    let details;
    let masterFlag;

    masterFlag =  room[roomId]["players"][sessionId]["master"];
    
    // 最初と最後のユーザ役職状態表示

    result ="You lose...";
    for (let i =0; i < gameResult["win"].length; i++) {
      
      let id = gameResult["win"][i];
      if (id == sessionId) {
        result = " You win!!";
        break;
      }
    }
    details =  gameResult["details"];
    socket.emit("game_result", result, details, masterFlag);
  })
  
  // リプレイ時に変数,画面表示の初期化
  socket.on("request_replay",(roomId) => {
    // 変数の初期化
    initialize(roomId);
    io.to(roomId).emit("initializeHTML");
  })
  
});

