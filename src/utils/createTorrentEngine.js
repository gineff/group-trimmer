import torrentStream from 'torrent-stream'

export const createTorrentEngine = (torrent, { verify, buffer }) => {
  const options = {
    verify,
  }

  if (buffer) {
    options.path = buffer
  }

  const engine = torrentStream(torrent, options)
  return engine
}
