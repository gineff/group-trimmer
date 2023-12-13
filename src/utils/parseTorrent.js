import { remote } from 'parse-torrent'
import { promisify } from 'node:util'

export const parseTorrent = async (input) => {
  try {
    const promisifiedRemote = promisify(remote)
    const torrentInfo = await promisifiedRemote(input)
    return torrentInfo
  } catch (error) {
    console.error(
      'Ошибка при чтении или парсинге торрент-файла или магнет-ссылки:',
      error.message,
    )
    return null
  }
}
