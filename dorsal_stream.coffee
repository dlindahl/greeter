Deferred = require('Deferred')
first = require('first')
Needle = require('needle')


class DorsalStream
  constructor: (faces, @options) ->
    @faces = for face in faces
      new Buffer( face.replace(/^data:image\/\w+;base64,/, ""), "base64")

  # TODO: Support multiple faces
  process: ->
    new DorsalStream.Request( @faces[0], @options ).execute()


class DorsalStream.Request
  constructor: (@image_buffer, @options) ->
    @build_options()
    @build_data()

  build_options: ->
    @options ||= {}

    @options.multipart ?= true
    @options.timeout ||= 5000

  build_data: ->
    @data =
      api_key: DorsalStream.face_api_key
      api_secret: DorsalStream.face_api_secret
      attributes: 'all'
      filename:
        content_type: 'image/png'
        buffer: @image_buffer
        filename: 'face.png'

  execute: ->
    dfd = new Deferred()

    post_options = ['http://api.face.com/faces/detect.json', @data, @options]

    first ->
      Needle.post post_options..., this
    .then (err, request, response) ->
      if err
        dfd.reject err
      else if response.status != 'success'
        dfd.reject "#{response.error_code}: #{response.error_message}"
      else
        photo = response.photos[0]

        if photo.tags.length > 0
          faces = for face in photo.tags
            do (face) ->
              new DorsalStream.Analysis(photo, face)

          dfd.resolve faces
        else
          dfd.reject null, new DorsalStream.Analysis(photo)

    dfd


class DorsalStream.Analysis
  constructor: (photo, face) ->
    @photo =
      url: photo.url
      pid: photo.pid
      width: photo.width
      height: photo.height

    for prop, val of face
      @[prop] = val


DorsalStream.face_api_key = process.env.FACE_API_KEY
DorsalStream.face_api_secret = process.env.FACE_API_SECRET

module.exports = DorsalStream
