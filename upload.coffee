config = require './config.coffee'
# coffeelint: disable=coffeescript_error
{async, await} = require 'asyncawait'
# coffeelint: enable=coffeescript_error
path = require 'path'

mediainfo = require './core/mediainfo'
mktorrent = require './core/mktorrent'
ab = require './ab'

module.exports = async (meta) ->
  info = await mediainfo.fromFile(meta.path)
  info.text = info.text.replace(meta.path, meta.file)

  torrentFile = path.join(config.torrent_dir, meta.file + '.torrent')
  torrent = path.resolve(torrentFile)
  await mktorrent(meta.path, torrent, config.tracker_url)

  await ab.upload(info, torrentFile, meta)
