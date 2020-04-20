    let express = require("express"),
        app = express(),
        server = require("http").Server(app),
        // app = require('http').createServer(handler),     Expressになってから不要
        fs  =   require('fs'),
        io  =   require('socket.io')(server),
        session = require("express-session"),
        morgan = require("morgan"),
        redis = require("redis"), 
        // client = redis.createClient(6379, 'redis');
        client = redis.createClient();
 

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
      
      // トップページ
      app.get('/', function(req, res){
        res.render('index');
        console.log(req.session.id);

      });
      // roomページへリダイレクト
      app.post('/', function(req, res) {
        let id = req.body.id;
        res.redirect(`/${id}`);
        // res.location('/${id}')
      })
      // roomページ
      app.get('/:room_id', function(req, res){
        res.render('room', {
          num: req.params.room_id,
          name: 'rinsei'
        });
      });
      
      // redisのテストコード
      client.on("error", function(error) {
        console.error(error);
      });
      client.get("test", redis.print);
      client.get("key", redis.print);
      client.get("misssing-key", function(err, reply) {
        // reply is null when the key is missing
          console.log(reply);
      });

console.log('Server running …');

// 下記、Express移行のため不要になった
// 
// 
// function handler(req, res) {
//   let url = req.url;
//   if ('/' == url) {
//     fs.readFile('./index.html', 'UTF-8', function (err, data) {
//       res.writeHead(200, {'Content-Type': 'text/html'});
//       res.write(data);
//       res.end();
//     });
//   } else if ('/css/style.css' == url) {
//         fs.readFile('./css/style.css', 'UTF-8', function (err, data) {
//         res.writeHead(200, {'Content-Type': 'text/css'});
//         res.write(data);
//         res.end();
//         });
//     } else if ('/js/main.js' == url) {
//         fs.readFile('./js/main.js', 'UTF-8', function (err, data) {
//         res.writeHead(200, {'Content-Type': 'text/js'});
//         res.write(data);
//         res.end();
//         });
//     }
// }

// プレイ人数の役職の配列を作る
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
    roles.push('thief');
  }
  for(let i = roles.length - 1; i > 0; i--){
    let r = Math.floor(Math.random() * (i + 1));
    let tmp = roles[i];
    roles[i] = roles[r];
    roles[r] = tmp;
  }
  return roles;
}

io.sockets.on('connection', socket =>{
  //Field初期化
  let field = {
    playerNum : 0,
    villager : 0,
    wolfman : 0,
    thief : 0,
    fortune : 0,
  }

  socket.on('settings_from_master', data => {
    //　settingsでもらった値をサーバに保存
    field.playerNum = data.playerNum;
    field.villager = data.villager;
    field.wolfman = data.wolfman;
    field.thief = data.thief;
    field.fortune = data.fortune;
    
    io.emit('settings_from_server', data);
  });
  
  socket.on('toNightClicked', () => {
    io.emit('roles_from_server',randomRole(field));
    
  });

  socket.on('join_from_player', data =>{
    console.log(`${data.num}`);
    console.log(`${data.name}`);
    io.emit(`join_from_server`, data);
  });
});
