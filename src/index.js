#!/usr/bin/env node

import { program } from 'commander'
import { resolve, basename, extname } from 'node:path'
import {
  createHash,
  makeDir,
  checkIsTorrent,
  createTorrentServer,
} from './utils/index.js'
import { Trimmer } from './trimmer.js'
import { Monitor } from './monitor.js'
import { Controller } from './controller.js'

program
  .option('-i, --input <input>', 'video source')
  .option('-p, --path <path>', 'change destination path', './tmp')
  .option('-l, --log', 'display ffmpeg log', false)
  .option('-t, --timeout <timeout>', 'timeout in sec. for trim process', '60')
  .option('-r, --retries <retries>', 'number of retries for trim process', '10')
  .option('-c, --check', 'verify torrent', false)
  .option('-s,--streams <streams>', 'the number of concurrent streams', '3')
  .parse(process.argv)

const trimmers = []
const { input, path, timeout, retries, streams, log, check } = program.opts()
const ranges = program.args.map(parseSegments)

const makeOutput = (fileName, range, path) => {
  const hash = createHash(fileName)
  const [startTime, duration] = range
  const ext = extname(fileName) ?? '.mp4'
  return resolve(path, `${hash}-${startTime}-${duration}${ext}`)
}

function parseSegments(segment) {
  const segmentFormat = {
    ['hh:mm:ss-duration']: /(\d{2}):(\d{2}):(\d{2})-(\d+)/,
    ['startTime-duration']: /^(\d+)-(\d+)/,
  }
  const match = segment.match(segmentFormat['hh:mm:ss-duration'])
  if (match !== null) {
    const [, hrs, min, sec, duration] = Array.from(match, (val) => +val)
    return [(hrs * 60 + min) * 60 + sec, duration]
  }
  if (segmentFormat['startTime-duration'].test(segment.trim())) {
    return segment.split('-')
  }
  return [0, 0]
}

await makeDir(path)
const isTorrent = checkIsTorrent(input)
const { torrentFileName, host, port } = isTorrent
  ? await createTorrentServer(input, { verify: check })
  : {}
const currentInput = isTorrent ? `${host}:${port}` : input
const fileName = torrentFileName || basename(currentInput)

for (const range of ranges) {
  trimmers.push(
    new Trimmer({
      input: currentInput,
      range,
      output: makeOutput(fileName, range, path),
      log,
    }),
  )
}
new Monitor(trimmers)
new Controller({ trimmers, retries, concurrentStreams: streams, timeout })
