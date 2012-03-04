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
        buffer,
        filepath = "face.png";

        buffer = new Buffer( data.captured.replace(/^data:image\/\w+;base64,/, ""), "base64" );
        // TODO: Don't save to disk
        file = fs.openSync( filepath, "w+" );

        // Output regenerated, compressed code
        fs.write( file, buffer, 0, buffer.length, 0, function( err, data ) {
          if ( err == null ) {
            console.log( "Saved: " + filepath );
          } else {
            console.log(err)
          }
        });


    var options = {
      multipart : true,
      timeout : 5000
    }

    var data = {
      api_key     : process.env.FACE_API_KEY,
      api_secret  : process.env.FACE_API_SECRET,
      attributes  : 'all',
      filename    : {
        content_type  : 'image/png',
        file          : filepath
      }
    }

    Needle.post('http://api.face.com/faces/detect.json', data, options, function(err, req, response) {
      if(err) {
        io.sockets.emit('unrecognized', err);
      } else if(!response.photos || (response.photos && response.photos.length === 0)) {
        io.sockets.emit('unrecognized', 'No faces');
      } else {
        io.sockets.emit('recognized', response.photos[0].tags[0].attributes);
      }
      console.log('done.', response)
    });

  })
});


console.log('Server started on port 3000');