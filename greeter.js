var connect = require('connect'),
    socket = require('socket.io'),
    http = require('http'),
    fs = require('fs'),
    Needle = require('needle');


var app = connect()
  .use( connect.static(__dirname + '/public') )
  .use( connect.static(__dirname + '/node_modules/socket.io/node_modules/socket.io-client/dist') )
  .use( connect.static(__dirname + '/vendor/assets') );

http.Server(app).listen(3000);

io = socket.listen(3001);
io.sockets.on('connection', function(client) {
  console.log('connection!')

  client.on('init', function(data) {
    io.sockets.emit('initialized', data);
  });

  client.on('capture', function(data) {
    var file,
        buffer;

    buffer = new Buffer( data.captured.replace(/^data:image\/\w+;base64,/, ""), "base64" );

    var options = {
      multipart : true,
      timeout   : 5000
    }

    var data = {
      api_key     : process.env.FACE_API_KEY,
      api_secret  : process.env.FACE_API_SECRET,
      attributes  : 'all',
      filename    : {
        content_type  : 'image/png', // TODO: Auto-detect MIME-type?
        buffer        : buffer,
        filename      : 'face.png'
      }
    }

    Needle.post('http://api.face.com/faces/detect.json', data, options, function(err, req, response) {
      if(err) {
        io.sockets.emit('unrecognized', err);
      } else {
        var photo,
            tag,
            attributes,
            recognizable;

        if( response.photos && response.photos.length > 0 ) {
          photo = response.photos[0];
          if( photo.tags && photo.tags.length > 0 ) {
            tag = photo.tags[0];
            recognizable = tag.recognizable;
            attributes = tag.attributes;
          }
        }

        if( recognizable ) {
          io.sockets.emit('recognized', photo, attributes);
        } else if( photo && tag ) {
          io.sockets.emit('detected', photo, attributes);
        } else {
          io.sockets.emit('unrecognized', 'No faces', photo);
        }
      }

      console.log('done.', photo);
    });

  })
});


console.log('Server started on port 3000');