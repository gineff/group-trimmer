import { spawn } from 'node:child_process'
import { resolve } from 'node:path'
import { program } from 'commander'
import ini from 'ini'

import { createHash, makeDir } from './utils'

type TrimmerProps = {
  link: string
  range: Range
  hash: string
  catalog: string
}

type Progress = {
  bitrate: string
  totalSize: number
  outTimeMs: number
  status: string
}

class Trimmer {
  ffmpegOptions: string[]
  progress = {} as Progress
  range: Range = [0, 0]
  constructor({ link, range, catalog, hash }: TrimmerProps) {
    const [startTime, duration] = range
    this.range = range
    const fileName = `${hash}-${startTime}-${duration}.mp4`
    const filePath = resolve(catalog, fileName)

    this.ffmpegOptions = [
      '-ss',
      `${startTime}`,
      '-i',
      link,
      '-t',
      `${duration}`,
      '-c',
      'copy',
      '-progress',
      'pipe:1',
      '-y',
      filePath,
    ]
  }
  read() {
    return new Promise((resolve, reject) => {
      const ffmpeg = spawn('ffmpeg', this.ffmpegOptions)

      ffmpeg.on('close', code => {
        resolve(code)
      })

      ffmpeg.on('error', e => {
        reject(e)
      })

      ffmpeg.stdout.on('data', data => {
        const { bitrate, total_size, out_time_ms, progress } = ini.decode(
          data.toString()
        )
        this.progress = {
          bitrate,
          status: progress,
          totalSize: total_size,
          outTimeMs: out_time_ms,
        }
      })

      if (!quiet) {
        ffmpeg.stderr.on('data', data => {
          console.error(`ffmpeg: ${data}`)
        })
      }
    })
  }
  toString() {
    const width = 70
    const value = Math.abs(this.progress.outTimeMs) / 1000000 || 0
    const percentage = (value / this.range[1]) * 100
    const progress = Math.round((width * percentage) / 100)
    const progressText = '='.repeat(progress).padEnd(width, ' ')
    return `[${progressText}] ${percentage.toFixed(2)}% \r\n`
  }
}

class Monitor {
  observed: Trimmer[] = []
  watch = (part: Trimmer) => {
    const observer = new Proxy(part, {
      set: (target, prop, val) => {
        //@ts-ignore
        target[prop] = val
        this.render()
        return true
      },
    })
    this.observed.push(observer)
    return observer
  }
  render = () => {
    process.stdout.write('\x1Bc\r' + this.observed.join(''))
  }
}

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

program
  .option('-i, --input <input>', 'video source')
  .option('-p, --path <path>', 'change destination path', './tmp')
  .option('-q, --quiet', 'hide ffmpeg log')
  .option(
    '-s, --streams <streams>',
    'the number of concurrent trim streams',
    '3'
  )
  .parse(process.argv)

const argv = program.opts()

const quiet = argv.quiet
const hash = createHash(argv.input)
const ranges = program.args.map(parseSegments)

const monitor = new Monitor()

const startProcess = async () => {
  const parts: Trimmer[] = []
  await makeDir(argv.path)

  try {
    for (const range of ranges) {
      const part = new Trimmer({
        link: argv.input,
        range,
        catalog: argv.path,
        hash,
      })
      const proxy = monitor.watch(part)
      parts.push(proxy)
    }

    while (parts.length) {
      const promises: Promise<unknown>[] = []
      const streams = parts.splice(0, argv.streams)

      streams.forEach(stream => {
        promises.push(stream.read())
      })
      await Promise.all(promises)
    }
  } catch (e) {
    console.log('error', e)
  }
}

startProcess()

//ToDo fileMask
//ToDo тоже самое расширение файла
