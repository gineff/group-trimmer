import {
  parseTorrent,
  selectFile,
  createTorrentEngine,
  createServer,
} from './index.js'
import config from '../config.js'

export const createTorrentServer = async (
  torrentSource,
  { verify } = { verify: true },
) => {
  const torrent = await parseTorrent(torrentSource)
  const fileIndex = await selectFile(torrent?.files)
  const engine = createTorrentEngine(torrent, { verify })
  const file = engine.files[fileIndex]
  const server = await createServer(file)

  return new Promise((resolve) => {
    engine.on('ready', async () => {
      server.listen(config.port)
      resolve({
        instance: server,
        host: 'http://localhost',
        port: config.port,
        torrentFileName: file.name,
      })
    })
  })
}
