    let http = require('http'),
        fs  =   require('fs');

    let server = http.createServer();

server.on('request', getCss);
server.listen(1338, 'localhost');
console.log('Server running …');

function getCss(req, res) {
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
