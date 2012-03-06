var socket = io.connect('http://localhost:3001'),
    ccv = window.ccv,
    media = document.getElementById('media_src'),
    canvas = document.getElementById('buffer'),
    context = canvas.getContext('2d'),
    output = document.createElement('canvas');

var run = null;

socket.on('connect', function() {
  console.log('connected!')
  if( run === false ) {
    dumpFrame();
  }
});

socket.on('disconnect', function() {
  console.log('disconnected!')
  run = false;
});


function setHTML(face) {
  if( face.attributes.age_est ) {
    $('#age').html( face.attributes.age_est.value );
  }
  if( face.attributes.gender ) {
    $('#gender').html( face.attributes.gender.value );
  }
  if( face.attributes.mood ) {
    $('#mood').html( face.attributes.mood.value );
  }
  if( face.attributes.smiling ) {
    $('#smiling').html( face.attributes.smiling.value );
  }

  $('#face').attr('src', face.photo.url);
}

socket.on('detected', function(faces) {
  console.log('[detected]', faces);

  $('#can_recognize').html('No');
  setHTML( faces[0] );
});

socket.on('recognized', function(faces) {
  console.log('[recognized]', faces);

  $('#can_recognize').html('Yes');
  setHTML( faces[0] );
});

socket.on('unrecognized', function(err, analysis) {
  console.log('[unrecognized]', err, analysis);
  if( analysis ) {
    $('#face').attr('src', analysis.photo.url);
  }
  setTimeout( dumpFrame, 5000);
});

function getUserMedia( callback ) {
  var getMedia = navigator.getUserMedia || navigator.webkitGetUserMedia,
      media = navigator.getUserMedia ? { video: true, audio: true } : "video,audio";

  if( getMedia ) {
    getMedia.call( navigator, media, function( data ) {
      var stream = window.webkitURL ? window.webkitURL.createObjectURL( data ) : data;

      callback( stream );
    });
  } else {
    console.log("couldn't get media!");
  }
}

function dumpFrame() {
  if(run) {
    context.drawImage( media, 0, 0, canvas.width, canvas.height );
    detectFaces();
  }
}
$('#detect').click(dumpFrame);

function detectFaces() {
  var comp = ccv.detect_objects({
    canvas : (ccv.grayscale(canvas)),
    cascade : window.cascade,
    interval : 5,
    min_neighbors : 1
  });

  if( comp.length > 0 ) {
    capture(comp[0])
  } else {
    console.log('no one detected');
    setTimeout( dumpFrame, 1500 );
  }
}

function capture(location) {
  var ctx = output.getContext('2d'),
      offset = 20;

  output.width = location.width + offset * 2;
  output.height = location.height + offset * 4;

  ctx.drawImage( canvas, -(location.x - offset), -(location.y - offset) );

  var imgData = output.toDataURL();

  socket.emit( 'capture', { captured: imgData });
}

getUserMedia(function( stream ) {
  media.src = stream;

  // When video signals that it has loadedmetadata, begin "playing"
  this.media.addEventListener( "loadedmetadata", function() {
    this.media.play();

    // dumpFrame()
    run = true;
    setTimeout(dumpFrame, 1000)
  }.bind(this), false);

});
