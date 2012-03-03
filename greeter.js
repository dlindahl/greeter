var connect = require('connect'),
    http = require('http');

var app = connect()
  .use( connect.static(__dirname + '/public') )
  .use( connect.static(__dirname + '/vendor/assets') );

http.Server(app).listen(3000);

console.log('Server started on port 3000');