import { spawn } from 'node:child_process'
import { resolve } from 'node:path'
import { EventEmitter } from 'node:events'
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

enum Status {
  idle,
  running,
  failed,
  done,
}

class Trimmer {
  status: Status = Status.idle
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
      let updated = false

      const id = setInterval(() => {
        if (updated) {
          return (updated = false)
        } else {
          ffmpeg.kill()
          this.status = Status.idle
          return false
        }
      }, 60.0)

      ffmpeg.on('close', code => {
        this.status = Status.done
        clearInterval(id)
        resolve(code)
      })

      ffmpeg.on('error', e => {
        this.status = Status.failed
        clearInterval(id)
        reject(e)
      })

      ffmpeg.stdout.on('data', data => {
        const { bitrate, total_size, out_time_ms, progress } = ini.decode(
          data.toString()
        )
        updated = true
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
    let progressText = ''
    let percentage = 0

    try {
      const value =
        this.progress.outTimeMs > 0 ? this.progress.outTimeMs / 1000000 : 0
      percentage = (value / this.range[1]) * 100
      const progress = Math.round((width * percentage) / 100)
      progressText = '='.repeat(progress).padEnd(width, ' ')
    } catch (e) {
      console.log(e)
    }

    return `[${progressText}] | ${(
      this.range[0] +
      '-' +
      this.range[1]
    ).padStart(7, ' ')} | ${percentage.toFixed(2)}% \r\n`
  }
}

class Monitor extends EventEmitter {
  observed: Trimmer[] = []
  streamsCount?: number
  observe (trimmers: Trimmer[]) {
    trimmers.forEach(trimmer => {
      const observer = new Proxy(trimmer, {
        set: (target: Trimmer, prop: keyof Trimmer, val) => {
          target[prop] = val
          if (prop === 'status') {
            this.emit('change', val)
          } else {
            this.render()
          }
          return true
        },
      })
      this.observed.push(observer)
    })
    return this
  }
  run(streams: number) {
    this.streamsCount = streams
    for(let i=0; i < this.streamsCount; i++ ){
      this.observed[i]?.read()
    }
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
  const trimmers: Trimmer[] = []
  await makeDir(argv.path)

  for (const range of ranges) {
    const trimmer = new Trimmer({
      link: argv.input,
      range,
      catalog: argv.path,
      hash,
    })
    trimmers.push(trimmer)
  }  
  monitor.observe(trimmers).run(argv.streams)
}

startProcess()

//ToDo fileMask
//ToDo тоже самое расширение файла
//прогресс бар останавливается на 99.99
//при загрузке торрента занчение процентов то ++ то --
//последовательность конвертации
//загружает несколько файлов и останавливается
