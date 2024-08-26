import {
  parseTorrent,
  selectFile,
  createTorrentEngine,
  createServer,
} from './index.js'
import getPort from 'get-port'

export const createTorrentServer = async (
  torrentSource,
  { verify, buffer, defaultPort } = { verify: true, defaultPort: 8888 },
) => {
  const torrent = await parseTorrent(torrentSource)
  const fileIndex = await selectFile(torrent?.files)
  const engine = createTorrentEngine(torrent, { verify, buffer })
  const file = engine.files[fileIndex]
  const server = await createServer(file)

  return new Promise((resolve) => {
    engine.on('ready', async () => {
      const port = await getPort({
        port: +defaultPort,
      })

      server.listen(port)
      resolve({
        instance: server,
        host: 'http://localhost',
        port: port,
        torrentFileName: file.name,
      })
    })
  })
}
