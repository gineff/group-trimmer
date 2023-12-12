#!/usr/bin/env node

import { program } from 'commander'
import { resolve } from 'node:path'
import { createHash, getFileName, makeDir } from './utils/index.js'
import { Trimmer } from './trimmer.js'
import { Monitor } from './monitor.js'
import { Controller } from './controller.js'

program
  .option('-i, --input <input>', 'video source')
  .option('-p, --path <path>', 'change destination path', './tmp')
  .option('-l, --log', 'display ffmpeg log', false)
  .option('-t, --timeout <timeout>', 'timeout in sec. for trim process', '60')
  .option('-r, --retries <retries>', 'number of retries for trim process', '10')
  .option('-s,--streams <streams>', 'the number of concurrent streams', '3')
  .parse(process.argv)

const trimmers = []
const { input, path, timeout, retries, streams, log } = program.opts()
const ranges = program.args.map(parseSegments)

const makeOutput = async (input, range, path) => {
  const fileName = await getFileName(input)
  const hash = createHash(fileName)
  const [startTime, duration] = range
  const ext = fileName.split('.').at(-1) ?? 'mp4'
  return resolve(path, `${hash}-${startTime}-${duration}.${ext}`)
}

function parseSegments(segment) {
  const segmentFormat = {
    ['hh:mm:ss-duration']: /(\d{2}):(\d{2}):(\d{2})-(\d+)/,
    ['startTime-duration']: /^(\d+)-(\d+)/,
  }
  const match = segment.match(segmentFormat['hh:mm:ss-duration'])
  if (match !== null) {
    const [_i, hrs, min, sec, duration] = Array.from(match, val => +val)
    return [(hrs * 60 + min) * 60 + sec, duration]
  }
  if (segmentFormat['startTime-duration'].test(segment.trim())) {
    return segment.split('-')
  }
  return [0, 0]
}

const startProcess = async () => {
  await makeDir(path)
  for (const range of ranges) {
    trimmers.push(
      new Trimmer({
        input,
        range,
        output: await makeOutput(input, range, path),
        log,
      })
    )
  }
  new Monitor(trimmers)
  new Controller({ trimmers, retries, concurrentStreams: streams, timeout })
}

startProcess()
