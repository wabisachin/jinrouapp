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
io.sockets.on('connection', socket =>{
  socket.on('settings_from_master', data => {
    console.log("setting");
    io.emit('settings_from_server', data);
  });
  socket.on('join_from_player', data =>{
    console.log(`${data.num}`);
    console.log(`${data.name}`);
    io.emit(`join_from_server`, data);
  });
});
