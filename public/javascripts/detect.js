var ccv = window.ccv,
    media = document.getElementById('media_src'),
    canvas = document.getElementById('buffer'),
    context = canvas.getContext('2d');



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

var run = true;
setTimeout( function() { run = false; }, 10000 );

function dumpFrame() {
  if(!run) return;

  context.drawImage( media, 0, 0, canvas.width, canvas.height );
  detectFaces();
}

function outlineFaces(comp) {
  context.lineWidth = 3;
  context.strokeStyle = "#f00";

  // draw detected area
  for (var i = 0; i < comp.length; i++) {
    console.log( comp[i].confidence, comp[i].width, comp[i].height )
    context.strokeRect(comp[i].x, comp[i].y, comp[i].width, comp[i].height);
  }

  setTimeout( dumpFrame, 100 );
}

function detectFaces() {
  var comp = ccv.detect_objects({
    canvas : (ccv.grayscale(canvas)),
    cascade : window.cascade,
    interval : 5,
    min_neighbors : 1
  });

  if( comp.length > 0 ) {
    outlineFaces(comp);
  } else {
    dumpFrame();
  }
}

getUserMedia(function( stream ) {
  media.src = stream;

  // When video signals that it has loadedmetadata, begin "playing"
  this.media.addEventListener( "loadedmetadata", function() {
    this.media.play();

    dumpFrame()
  }.bind(this), false);

  // On timeupdate events, draw the video frame to the canvas
  // this.media.addEventListener( "timeupdate", function(e) {
  //   // console.log('timeupdate!', e.timeStamp)
  // //   this.draw();
  //   // dumpFrame();
  // }.bind(this), false);

});
