import { remote } from 'parse-torrent'

export const parseTorrent = async (input) => {
  return new Promise((resolve) => {
    remote(input, (err, parsedTorrent) => {
      if (err) throw err
      resolve(parsedTorrent)
    })
  }).catch((error) => {
    console.error(
      'Ошибка при чтении или парсинге торрент-файла или магнет-ссылки:',
      error.message,
    )
    return null
  })
}
