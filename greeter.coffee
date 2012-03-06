connect = require('connect')
socket  = require('socket.io')
http    = require('http')
DorsalStream = require('./dorsal_stream')

app = connect()
  .use( connect.static(__dirname + '/public') )
  .use( connect.static(__dirname + '/node_modules/socket.io/node_modules/socket.io-client/dist') )
  .use( connect.static(__dirname + '/vendor/assets') )

http.Server(app).listen(3000)

io = socket.listen(3001)

io.sockets.on 'connection', (client) ->
  client.on 'init', (data) -> io.sockets.emit 'initialized', data

  client.on 'capture', (data) ->
    console.log 'capture!'

    new DorsalStream([ data.captured ])
      .process()
      .fail (err, analysis) ->
        io.sockets.emit 'unrecognized', 'No faces', analysis
      .done (face) ->
        if face.recognizable
          io.sockets.emit 'recognized', face
        else
          io.sockets.emit 'detected', face



console.log 'Server started on port 3000'