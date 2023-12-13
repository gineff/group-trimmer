const magnetRegex = /^magnet:\?xt=urn:[a-zA-Z0-9-]+:[a-zA-Z0-9]+.*$/
const torrentFileRegex = /\.torrent$/i

export const checkIsTorrent = input =>
  magnetRegex.test(input) || torrentFileRegex.test(input)
