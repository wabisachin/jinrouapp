 /*----------------------------------------------------------------------------
 バグ修正ログ

 
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
        path = require('path'),
        jinrou = require('./module');
        
        // cookieParser = require('cookie-parser'),
        // redis = require("redis"), 
        // client = redis.createClient(6379, 'redis');
        // client = redis.createClient();
 
 /*----------------------------------------------------------------------------
 
                  グローバル変数定義
 
 ----------------------------------------------------------------------------*/
    // roomには
    
    let room = {}
    
 /*----------------------------------------------------------------------------
 
                  関数定義
 
 ----------------------------------------------------------------------------*/
 
 //ユーザのブラウザにCookie保存する
  function setCookie(key, value, res) {
    const escapedValue = escape(value);
    res.setHeader('Set-Cookie', [`${key}=${escapedValue}`]);
    // res.cookie(key, value);
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
  
 /*----------------------------------------------------------------------------
 
                  Expressの設定
 
 ----------------------------------------------------------------------------*/
      // server.listen(8080, 'localhost');
      const PORT = process.env.PORT || 5000
      
      //テンプレートはviewsフォルダに保存
      app.set('views', __dirname + '/views');
      app.set('view engine', 'ejs');
      // app.set('port', (process.env.PORT || 8080));
      
      // server.listen(PORT, 'localhost');
      server.listen(PORT);
      
      //middleware
      // app.use(cookieParser())
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
      console.log('Server running …');
      
      // トップページ ->アクセスしたときクライアントCookieにセッション保存
      app.get('/', function(req, res){
        setCookie("sessionId", req.session.id, res);
        // indexに現在存在するルーム一覧とmasterを取得
        // let masters = jinrou.setMasterInfo(room);
        let masters = jinrou.setMasterInfo(room);
        // let rooms = Object.keys(room);
        // let masters = {};
        // rooms.forEach(roomId => {
        //   let roomInfo = {}
        //   roomInfo['masterName'] = Object.values(room[roomId].players)[0].userName;
        //   roomInfo['playerNum'] = room[roomId].playerNum;
        //   roomInfo['currentPlayerNum'] = room[roomId].currentPlayerNum;
        //   masters[roomId] = roomInfo;
        // });
        
        if (req.query.reason == "leaving") {
          res.render('index', {
          alert_title: "Notice", 
          alert_message: `${req.query.name}が退出しました`,
          masters: masters
          })
        }
        else if (req.query.reason == "dissolved") {
          res.render('index', {
          alert_title: "Notice", 
          alert_message: "roomが解散されました",
          masters: masters
          })
        }
        else {
          res.render('index', {
          alert_title: "", 
          alert_message: "",
          masters: masters
          })
        };
      });
      
      // 条件をパスすればroomページへリダイレクト
      app.post('/', function (req, res)  {
        
        let masters = jinrou.setMasterInfo(room);
        let roomId = req.body.roomId;
        
        setCookie("sessionId", req.session.id, res);
        //部屋作成の場合
        if(req.body.makeRoom === 'true'){
          
          // もし同じ部屋番号のルームが既にある場合はTopPageへリダイレクト
          if (jinrou.checkRoomExisting(room, roomId)) {
            res.render('index', {
              alert_title: "Error", 
              alert_message: "そのルームは既に存在します！",
              masters: masters
            });
          }
          
          // 同じ部屋番号のルームがない場合は新規作成
          else {
            // fieldの初期化
            /* -------------------------補則------------------------------------
            dissolvedFlag追加について。新しいプレイヤーが入室した時にページをリロードするが、
            その時にsocketの接続が一度切れてしまう。接続が切れるとユーザーをトップページに帰してしまう仕様の為,
            (※詳しくはapp,js内のsocket.on("disconnect")のコードを参照）
            そのsocketの切断が実装の中で生じる切断or単純にクライアント側による切断かを
            判別するFlagを追加する必要があった
            -------------------------------------------------------------------*/
            let field = { 
                currentPlayerNum :0,
                currentVotedCount:0,
                playerNum : 0,
                villager : 0,
                wolfman : 0,
                fortune : 0,
                thief : 0,
                teruteru : 0,
                dissolvedFlag: 0, 
                players : {},
              }
              
            field.playerNum = req.body.playerNum;
            field.villager = req.body.villager;
            field.wolfman = req.body.wolfman;
            field.fortune = req.body.fortune;
            field.thief = req.body.thief;
            field.teruteru = req.body.teruteru;
            
            jinrou.userAdd(field, req.session.id,req.body.name);
            //新規room作成し、fieldを入れる
            room[roomId] = field;
            res.redirect(`/${roomId}`);
          }
          
        } 
        //既存ルームに入室する場合
        else {
          // 建てられてない部屋にアクセスした場合
          if (!jinrou.checkRoomExisting(room, roomId)) {
            res.render('index', {
              alert_title: "Error", 
              alert_message: "ルームが存在しませんでした。",
              masters: masters
            });
          }
          
          // 参加枠に空きがなかった場合
          else if (!jinrou.canIRoomIn(room, roomId, "post")) {
            res.render('index', {
              alert_title: "Error", 
              alert_message: "参加人数が上限に達しました。",
              masters: masters
            });
          }
          
          // 入室
          else {
            jinrou.userAdd(room[req.body.roomId], req.session.id, req.body.name);
            res.redirect(`/${req.body.roomId}`);
            console.log("ーーー入室ーーーー")
            console.log(room);
          }
          
        }
      })
      
      // roomページにfieldを渡す
      app.get('/:room_id', function(req, res){
        // let masters = jinrou.setMasterInfo(room);
        let masters = jinrou.setMasterInfo(room);
        let roomId = req.params.room_id;
        let sessionId =  getCookie("sessionId", req);

        // アクセス制限

        // 建てられてない部屋にアクセスした場合
        if (!jinrou.checkRoomExisting(room, roomId)) {
          setCookie("accessRight", 0 , res);
          res.render('index', {
            alert_title: "Error", 
            alert_message: "ルームが存在しませんでした",
            masters: masters
          });
        }
        // ルー��内にsessionIdが登録されていないプレイヤーがアクセスした場合
        else if (!jinrou.verificateSessionId(room, sessionId, roomId, req)) {
          setCookie("accessRight", 0 , res); // roomページへのアクセス権限がない場合の値は０
          console.log(room);
          res.render('index', {
            alert_title: "Error", 
            alert_message: "入室フォームから入室して下さい",
            masters: masters
          });
        }
        // 参加枠に空きがなかった場合
        else if (!jinrou.canIRoomIn(room, roomId, "get")) {
          res.render('index', {
            alert_title: "Error", 
            alert_message: "参加人数が上限に達しました。",
            masters: masters
          });
        }
        // 入室許可
        else {
          setCookie("accessRight", 1 , res); // roomページへのアクセス権限がない場合の値は１
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

/*----------------------------------------------------------------------------
 
                  SocketIOの設定
 
----------------------------------------------------------------------------*/

io.sockets.on('connection', socket => {

  // 入室したプレイヤーがmasterであれば1を返す
  socket.on("i_am_master?", (roomId, sessionId) => {
    console.log("----room----")
    console.log(room);
    console.log(room[roomId]["players"]);
    
    let currentPlayerNum = room[roomId]["currentPlayerNum"];
    let playerNum =  room[roomId]["playerNum"];
    let startFlag = currentPlayerNum == playerNum ? 1 : 0; //プレイヤー人数が揃ったかどうか
    let masterFlag =  room[roomId]["players"][sessionId]["master"]; //入室プレイヤーがmasterかどうか
    
    socket.emit("master_or_not", startFlag, masterFlag);
  })
  
  // toNightボタンがクリックされたらカードシャッフルして役職割当、完了したら通知
  socket.on('toNightClicked', (roomId) => {
    // フラグの初期化
    room[roomId]["dissolvedFlag"] = 0;
    
    // io.to(roomId).emit('roles_from_server', roleAsign(room[roomId],randomRole(room[roomId])));
    jinrou.roleAsign(room[roomId],jinrou.randomRole(room[roomId]));
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
    // 現在のsocketIdをデータベースに登録
    room[roomId]["players"][sessionId]["socketId"] = socket.id;
    // 新規playerがjoinした時だけリロードされるように条件分岐
    console.log("joinRoom!")
    if (myFlag == 0){
      console.log("myflag-------")
      room[roomId]["dissolvedFlag"] = 1;
      jinrou.changeOthersFlag(players, sessionId);
      socket.broadcast.to(data.roomId).emit('new_client_join');
    }
    else {
      players[sessionId]["flag"] = 0
    }
  })
  
  // 接続が切れた時
  socket.on("disconnect", (reason) => {
    // console.log("---disconnect---")
    // console.log(reason);
    // socket.connect();
    let disconnected = jinrou.disconnectedPlayer(room, socket.id);
    let roomIds = disconnected["rooms"];
    let playerName =  disconnected["playerName"]
    console.log("----disconnected----");
    console.log(socket.id);
    console.log(disconnected);
    console.log(room);
    roomIds.forEach(roomId =>  {
      console.log(room[roomId]["players"]);
      //サーバー仕様による切断でない場合、ルームに参加している他プレイヤー全員をトップページに戻す
      if (room[roomId]["dissolvedFlag"] == 0) {
        // ルームの解散
        io.to(roomId).emit("playerLeaving!", playerName);
        // 切断ユーザーが参加していたルームをDBから削除
        delete room[roomId];
      }
    })
    console.log("-----END-----")
  })
  
  socket.on("quitGame", (roomId) => {
    io.to(roomId).emit("room_dissolved!");
    // 切断ユーザーが参加していたルームをDBから削除
    delete room[roomId];
  })
  
  // 各クライアントの要求をトリガにそれぞれのplayer{}を渡す
  socket.on("request_role", (roomId, sessionId) => {
    socket.emit('give_role', room[roomId].players[sessionId]);
    // let role = room[roomId].players[sessionId][2];
    // socket.emit('give_role', role);
  });
  
  // wolfmanのユーザーに他のwolfmanを教える
  socket.on("i_am_wolfman", (roomId) => {
    socket.emit('all_wolfman', jinrou.wolfman(room, roomId) );
  });
  
  // fortuneのユーザーに占い結果を教える
  socket.on("i_am_fortune", (roomId, targetNo) => {
    let fortuneResult = jinrou.fortune(room, roomId, targetNo);
    socket.emit('fortune_result', fortuneResult);
  });
  
  // 夜に怪盗に交換相手の役職を伝える
  socket.on("i_am_thief", (roomId, targetNo, thiefNo) => {
    let thiefResult = jinrou.thiefBefore(room, roomId, targetNo, thiefNo);
    socket.emit('thief_result', thiefResult);
  });
  
  // 昼になった時に怪盗が役職交換実行
  socket.on("thief_action", (roomId, targetNo, thiefNo) => {
  jinrou.thiefAfter(room, roomId, targetNo, thiefNo);
  });
  
  // 同一ルームのプレイヤー全員に昼開始の通知、タイマースタート
  socket.on("day_begins", (roomId) => {
    // thiefがいたらthiefAfterの実行
    let playerNum = room[roomId]["playerNum"];
    
    io.to(roomId).emit("are_you_thief");
    io.to(roomId).emit("notice_day_started", playerNum);
  });
  
  // プレイヤーから投票先を受け取る
  socket.on("vote_for_wolfman", (userNo, roomId, sessionId) => {
    
    let playerNum = room[roomId]["currentPlayerNum"];
    
    // 投票先を投票者に保存
    room[roomId].players[sessionId]['voteTo'] = userNo
    // 選択されたプレイヤーへ投票
    jinrou.voteForPlayers(room, userNo, roomId);
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
    
    // 最初と最後のユーザ役職状態表示
    console.log("-------------最初の役割配布状態-------------");
    console.log(room[roomId].initialRoles);
    console.log("-------------最後の役割配布状態-------------");
    console.log(Object.values(room[roomId].players).map( player => player.userRole));
  })
  
  // 各ユーザーに対してゲーム結果を返す
  socket.on("response_my_sessionId", (roomId, sessionId) => {
    
    let gameResult = jinrou.getGameResult(room, roomId);
    let result;
    let details;
    let masterFlag;
    let initialRoles = room[roomId].initialRoles;
    let finalState = Object.values(room[roomId].players);

    masterFlag =  room[roomId]["players"][sessionId]["master"];

    result ="You lose...";
    for (let i =0; i < gameResult["win"].length; i++) {
      
      let id = gameResult["win"][i];
      if (id == sessionId) {
        result = " You win!!";
        break;
      }
    }
    details =  gameResult["details"];
    socket.emit("game_result", result, details, masterFlag, initialRoles, finalState);
  })
  
  // リプレイ時に変数,画面表示の初期化
  socket.on("request_replay",(roomId) => {
    // 変数の初期化
    jinrou.initialize(room, roomId);
    io.to(roomId).emit("initializeHTML");
  })
  
});

