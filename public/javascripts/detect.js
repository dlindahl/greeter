var socket = io.connect('http://localhost:3001'),
    ccv = window.ccv,
    media = document.getElementById('media_src'),
    canvas = document.getElementById('buffer'),
    context = canvas.getContext('2d'),
    output = document.createElement('canvas');

socket.on('connect', function() {
  console.log('connected!')
});

function setHTML(photo, attributes) {
  if( attributes.age_est ) {
    $('#age').html( attributes.age_est.value );
  }
  if( attributes.gender ) {
    $('#gender').html( attributes.gender.value );
  }
  if( attributes.mood ) {
    $('#mood').html( attributes.mood.value );
  }
  if( attributes.smiling ) {
    $('#smiling').html( attributes.smiling.value );
  }

  $('#face').attr('src', photo.url);
}

socket.on('detected', function(photo, attributes) {
  console.log('[detected]', attributes);

  $('#can_recognize').html('No');
  setHTML( photo, attributes );
});

socket.on('recognized', function(photo, attributes) {
  console.log('[recognized]', attributes);

  $('#can_recognize').html('Yes');
  setHTML( photo, attributes );
});

socket.on('unrecognized', function(err, photo) {
  console.log('[unrecognized]', err, photo);
  if( photo ) {
    $('#face').attr('src', photo.url);
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
  context.drawImage( media, 0, 0, canvas.width, canvas.height );
  detectFaces();
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
    dumpFrame();
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

    dumpFrame()
  }.bind(this), false);

});
