 /*----------------------------------------------------------------------------
 
                  Node.jsのrequire
 
 ----------------------------------------------------------------------------*/

    let express = require("express"),
        app = express(),
        server = require("http").Server(app),
        io  =   require('socket.io')(server),
        session = require("express-session"),
        morgan = require("morgan");
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
        res.render('index');
        console.log(`session: ${req.session.id}`);

      });
      
      // roomページへリダイレクト
      app.post('/', function (req, res)  {
        
        let roomId = req.body.roomId;
        
        //部屋作成の場合
        if(req.body.makeRoom === 'true'){
          
          // fieldの初期化
              let field = { 
                  currentPlayerNum :0,
                  playerNum : 0,
                  villager : 0,
                  wolfman : 0,
                  fortune : 0,
                  thief : 0,
                  players : {},
                }
                
          console.log(req.session.id);
          
        field.playerNum = req.body.playerNum;
        field.villager = req.body.villager;
        field.wolfman = req.body.wolfman;
        field.fortune = req.body.fortune;
        field.thief = req.body.thief;
        
        userAdd(field, req.session.id,req.body.name);
        
        //新規room作成し、fieldを入れる
        room[roomId] = field;
        
        res.redirect(`/${roomId}`);
        // res.location('/${id}')
        
        
        } else {
          
          
          //既存ルームに入室する場合
          console.log(req.session.id);
          
          userAdd(room[req.body.roomId],req.session.id,req.body.name);
          console.log(room[roomId].players);
          
          res.redirect(`/${req.body.roomId}`);
        }
      })
      
      // roomページにfieldを渡す
      app.get('/:room_id', function(req, res){
        res.render('room', {
          roomId: req.params.room_id,
          field: room[req.params.room_id],
        });
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
        if (field.currentPlayerNum < field.playerNum) {
          field.players[sessionId] = {
            plyerNo:  field.currentPlayerNum, 
            userName: userName,
            flag: 0, //直近の更新が手動or自動リロードかを判別するためのフラグ
          };
          field.currentPlayerNum++;
        } else {
          //プレイヤー数以上のアクセスが有った場合の処理
          
        }

      }
      
      
  //ユーザのブラウザにCookie保存する
  function setCookie(key, value, res) {
    const escapedValue = escape(value);
    res.setHeader('Set-Cookie', [`${key}=${escapedValue}`]);
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
        field.players[key].userRole = roles.pop() ;
      });
      console.log(field.players);
  }
  
  // 自分以外のプレイヤーのflagを０→１に変更。(flagは自動リロードチェック用)
  function changeOthersFlag(players, sessionId) {
    for (let key in players) {
        if (key == sessionId) { 
          continue
        }
        players[key]["flag"] = 1;
      }
  }

 /*----------------------------------------------------------------------------
 
                  SocketIOの設定
 
 ----------------------------------------------------------------------------*/

io.sockets.on('connection', socket => {

  
  // socket.on('toNightClicked', () => {
  //   io.emit('roles_from_server',randomRole(field));
    
  // });
  
  // toNightボタンがクリックされたらカードシャッフルして役職割当、完了したら通知
  socket.on('toNightClicked', (roomId) => {
    // io.to(roomId).emit('roles_from_server', roleAsign(room[roomId],randomRole(room[roomId])));
    roleAsign(room[roomId],randomRole(room[roomId]));
    io.to(roomId).emit('roles_asigned');
    
  });
  
  // socket.on('joinRoom_from_client', data => {
  //   console.log(`socket_id: ${data.user_id}がroom: ${data.room_id}に入室しました`);
  //   io.join(data.room_id);
  // });

  // わさび不要！いらなくなったかも->いらなければコメントアウトよろしく！りんせー不要
  // socket.on('join_from_player', data =>{
  //   io.emit(`join_from_server`, data);
  // });
  
  // 新しいクライアントが入室したときに部屋の中の他のクライアントのページ更新、roomにjoin
  socket.on("joinRoom_from_client", (data)=> {
    let roomId = data.roomId;
    let sessionId = data.sessionId;
    let players = room[roomId]["players"];
    console.log("okkkkk");
    console.log(players[sessionId]);
    console.log(players[sessionId]["flag"]);
    let myFlag = players[sessionId]["flag"];
    
    socket.join(data.roomId);
    if (myFlag == 0){
      changeOthersFlag(players, sessionId);
      socket.broadcast.to(data.roomId).emit('new_client_join');
    }
    
    else {
      // 自動リロードチェックflagをリセット
      players[sessionId]["flag"] = 0
    }
  })
  
  // 各クライアントの要求をトリガにそれぞれのplayer{}を渡す
  socket.on("request_role", (roomId, sessionId) => {
    socket.emit('give_role', room[roomId].players[sessionId]);
  
    // let role = room[roomId].players[sessionId][2];
    // socket.emit('give_role', role);
  });
  
  
  
  
});

