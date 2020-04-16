    let app = require('http').createServer(handler),
        fs  =   require('fs'),
        io  =   require('socket.io').listen(app);

    app.listen(8080, 'localhost');
    // app.on('request', handler);

console.log('Server running …');

function handler(req, res) {
  let url = req.url;
  if ('/' == url) {
    fs.readFile('./index.html', 'UTF-8', function (err, data) {
      res.writeHead(200, {'Content-Type': 'text/html'});
      res.write(data);
      res.end();
    });
  } else if ('/css/style.css' == url) {
        fs.readFile('./css/style.css', 'UTF-8', function (err, data) {
        res.writeHead(200, {'Content-Type': 'text/css'});
        res.write(data);
        res.end();
        });
    } else if ('/js/main.js' == url) {
        fs.readFile('./js/main.js', 'UTF-8', function (err, data) {
        res.writeHead(200, {'Content-Type': 'text/js'});
        res.write(data);
        res.end();
        });
    }
}

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

});
