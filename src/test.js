import {
  parseTorrent,
  selectFile,
  createTorrentEngine,
  createServer,
  getFileName,
} from './utils/index.js'

const torrent = await parseTorrent(
  'http://itorrents.org/torrent/D1B35EB550B4E0E579E2EEE404A032BE6E75DD7E.torrent'
)
const fileIndex = await selectFile(torrent?.files)
const engine = createTorrentEngine(torrent, { verify: true })
const server = await createServer(engine.files[fileIndex])
server.listen(8888)
const fileName = await getFileName('http://192.168.0.27:8888')
