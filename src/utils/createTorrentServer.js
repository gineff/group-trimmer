import {
  parseTorrent,
  selectFile,
  createTorrentEngine,
  createServer,
} from './index.js'
import config from '../config.js'

export const createTorrentServer = async (torrentSource, { verify }) => {
  const torrent = await parseTorrent(torrentSource)
  const fileIndex = await selectFile(torrent?.files)
  const engine = createTorrentEngine(torrent, { verify })
  const file = engine.files[fileIndex]
  const server = await createServer(file)
  server.listen(config.port)

  return new Promise((resolve) => {
    engine.on('ready', async () => {
      resolve([`http://localhost:${config.port}`, file.name])
    })
  })
}
