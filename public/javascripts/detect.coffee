socket = io.connect('http://localhost:3001')


writeData = (face) ->
  $('#age').html face.attributes.age_est.value
  $('#gender').html face.attributes.gender.value
  $('#mood').html face.attributes.mood.value
  $('#smiling').html face.attributes.smiling.value
  $('#face').attr 'src', face.photo.url

  $('#can_recognize').html face.recognizable


clearData = ->
  $('#age').html ''
  $('#gender').html ''
  $('#mood').html ''
  $('#smiling').html ''
  $('#face').removeAttr 'src'

  $('#can_recognize').html 'N/A'


# Socket Router
socket.on 'disconnect', -> console.log('disconnected!')

socket.on 'connect', ->
  console.log('connected!')

  vs = new VentralStream( $('video')[0], webRTC:true )
  vs.facesDetected (faces) ->
    console.log('analyzing...')
    socket.emit 'capture', captured:faces[0]


socket.on 'detected', (faces) ->
  console.log('[detected]', faces[0] )
  writeData faces[0]



socket.on 'recognized', (faces) ->
  console.log('[recognized]', faces[0])

  writeData faces[0]



# TODO: Write proper 'unrecognized' handler
socket.on 'unrecognized', (err, analysis) ->
  clearFaces
