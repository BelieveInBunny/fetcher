{execFile} = require 'child_process'
{parseString} = require 'xml2js'
Promise = require 'bluebird'
{async, await} = require 'asyncawait'
_ = require 'underscore'

execFile = Promise.promisify(execFile)
parseString = Promise.promisify(parseString)

module.exports.fromFile = async (file) ->
  [stdout, stderr] = await execFile('/usr/bin/env', ['mediainfo', file])
  text = stdout || ''

  [stdout, stderr] = await execFile('/usr/bin/env', ['mediainfo', '--Output=XML', file])
  xml = stdout || ''

  result = (await module.exports.parseXml(xml))
  return _.extend({text: text}, result)

module.exports.parseXml = async (xml) ->
  result = await parseString(xml)

  files = result.MediaInfo.media
  throw new Error('non-singular number of files ' + files.length) if files.length != 1
  tracks = files[0].track

  for track in tracks
    switch track['$'].type
      when 'General'
        {format} = track

      when 'Audio'
        audio = track.Format[0]

        if audio.toLowerCase() == 'mpeg audio'
          audio = 'MP3'

        if audio.toLowerCase().indexOf('ac-3') > -1
          audio = 'AC3'

        channels = track.Channels[0]
        if channels in ['7.1']
          audiochannels = '7.1'
        else if channels in ['6.1', '7']
          audiochannels = '6.1'
        else if channels in ['5.1', '6']
          audiochannels = '5.1'
        else if channels in ['5.0', '5']
          audiochannels = '5.0'
        else if channels in ['2.1', '3']
          audiochannels = '2.1'
        else if channels in ['2.0', '2']
          audiochannels = '2.0'
        else if channels in ['1.0', '1']
          audiochannels = '1.0'

      when 'Video'
        codec = track.Format[0]

        if codec.toLowerCase() == 'mpeg video'
          codec = 'MPEG-2'

        switch codec.toLowerCase()
          when 'div3', 'divx', 'dx50' then codec = 'DivX'
          when 'xvid' then codec = 'XviD'
          when 'x264' then codec = 'h264'

        if codec.toLowerCase().indexOf('avc') > -1
          codec = 'h264'

        if codec.toLowerCase().indexOf('hevc') > -1
          codec = 'h265'

        if track.BitDepth?[0] == '10' && (codec == 'h264' || codec == 'h265')
          codec += ' 10-bit'

  {result, audio, audiochannels, codec}
