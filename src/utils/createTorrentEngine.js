import torrentStream from 'torrent-stream'

export const createTorrentEngine = (
  torrent,
  { verify }
) => {
  const engine = torrentStream(torrent, {
    path: '/media/anri/b8f61008-4cfd-4018-a3c6-1689ab220721/torrents/',
    verify,
  })
  return engine
}
