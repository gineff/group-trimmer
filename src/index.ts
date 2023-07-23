import { mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import { resolve } from 'node:path'
import optimist from 'optimist'

const download = async (
  link: string,
  range: Range,
  path: string,
  hash: string
) => {
  const [startTime, duration] = range
  const fileName = `${hash}-${startTime}-${duration}.mp4`
  const filePath = resolve(path, fileName)
  //prettier-ignore
  const ffmpegOptions = ['-ss',`${startTime}`,'-i',link,'-t',`${duration}`,'-c','copy','-y',filePath]

  return new Promise((resolve, _reject) => {
    const ffmpeg = spawn('ffmpeg', ffmpegOptions)

    ffmpeg.on('close', code => {
      resolve(code)
    })

    if (!quiet) {
      ffmpeg.stderr.on('data', data => {
        console.error(`ffmpeg: ${data}`)
      })
    }
  })
}

const getHash = (str: string) =>
  createHash('sha256').update(str).digest('hex').slice(0, 16)

type Range = [startTime: number, duration: number]

const parseSegments = (segment: string): Range => {
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
    return segment.split('-') as unknown as Range
  }
  return [0, 0]
}

//prettier-ignore
const argv = optimist
  .alias('i', 'input').describe('i', 'video source link')
  .alias('p', 'path').describe('p', 'change destination path').default('p', './tmp')
  .alias('q', 'quiet').describe('q', 'hide ffmpeg log').boolean('q').argv
  .alias('d', 'downloads').describe('d', 'the number of concurrent downloads').default('d', 3)
  .argv

const link = argv.input
const quiet = argv.quiet
const hash = getHash(link)
const ranges = argv._.map(parseSegments)

const startProcess = async () => {
  if (!existsSync(argv.path)) {
    await mkdir(argv.path)
  }

  try {
    for (const range of ranges) {
      await download(link, range, argv.path, hash)
    }
  } catch (e) {
    console.log('error', e)
  }
}

startProcess()
