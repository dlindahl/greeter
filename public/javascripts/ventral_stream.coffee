socket = io.connect('http://localhost:3001')

# Shims
getUserMedia        = navigator.getUserMedia or navigator.webkitGetUserMedia
mediaStreamOptions  = if navigator.getUserMedia then video:true else "video"
buildStream         = (data) -> if window.webkitURL then window.webkitURL.createObjectURL( data ) else data

# Builds a frame buffer for analyzation.
buildBuffer = (source) -> document.createElement 'canvas'


# Determines the correct Adapter
mixinAdapter = ->
  if @source.nodeName == "VIDEO"
    if @options.webRTC
      new VentralStream.WebCamAdapter(@)




class WebCam
  constructor: ->
    dfd = new jQuery.Deferred()
    dfd.promise @

    if getUserMedia
      getUserMedia.call navigator, mediaStreamOptions, (data) =>
        dfd.resolve buildStream data
    else
      dfd.reject "Could not get User Media"




class VentralStream
  constructor: (@source, @options) ->
    @buffer = buildBuffer @source
    @context = @buffer.getContext('2d')

    mixinAdapter.call @

    @connect().done =>
      console.log 'done!'
      @detectFaces()
        .done( @facesDetectedCallback )
        .fail =>
          console.log('no faces, try again?')

  facesDetected: (callback) -> @facesDetectedCallback = callback



class VentralStream.Adapter
  constructor: (vs) ->
    @pasteboard = document.createElement 'canvas'
    @pb_context = @pasteboard.getContext '2d'

    # Mixin the Adapter methods with the VentralStream instance
    for prop, fn of @
      vs[prop] = fn

  connect: (@vs) -> throw "Not yet implemented"
  detectFaces:   -> throw "Not yet implemented"

  _get_objects_at: (locations) ->
    offset = 20

    for location in locations
      do (location) =>
        @pasteboard.width  = location.width  + offset * 2
        @pasteboard.height = location.height + offset * 4

        @pb_context.drawImage( @buffer, -(location.x - offset), -(location.y - offset) );

        @pasteboard.toDataURL()


class VentralStream.WebCamAdapter extends VentralStream.Adapter
  constructor: -> super

  connect: ->
    dfd = new jQuery.Deferred()

    new WebCam()
      .done (stream) =>
        @source.src = stream
        @source.addEventListener "loadedmetadata", ->
          @play()
          dfd.resolve stream
      .fail (err) ->
        throw err
        dfd.fail err

    dfd

  detectFaces: ->
    dfd = new jQuery.Deferred()

    @_snapshot()

    objs = window.ccv.detect_objects
      canvas        : window.ccv.grayscale(@buffer)
      cascade       : window.cascade
      interval      : 5
      min_neighbors : 1

    if objs.length == 0
      console.log('fail!')
      dfd.reject 'No objects detected'
    else
      dfd.resolve @_get_objects_at( objs )

    dfd.promise()

  _snapshot: ->
    @buffer.setAttribute 'width',  @source.clientWidth
    @buffer.setAttribute 'height', @source.clientHeight
    @context.drawImage( @source, 0, 0, @buffer.width, @buffer.height )


# TODO: Do proper export
window.VentralStream = VentralStream
