import { mkdir } from 'node:fs/promises'
import { spawn } from 'child_process'
import { createHash } from 'node:crypto'
import optimist from 'optimist'

const download = async (
  link: string,
  range: Range,
  path: string,
  hash: string
) => {
  const [startTime, duration] = range
  const fileName = `${hash}-${startTime}-${duration}.mp4`
  //prettier-ignore
  const ffmpegOptions = ['-ss',`${startTime}`,'-i',link,'-t',`${duration}`,'-c','copy','-y',`${path}/${fileName}`]

  return new Promise((resolve, _reject) => {
    const ffmpeg = spawn('ffmpeg', ffmpegOptions)

    ffmpeg.on('close', code => {
      console.log(`child process exited with code ${code}`)
      resolve(code)
    })

    ffmpeg.stderr.on('data', data => {
      if (1) {
        //if not quiet
        console.error(`ps stderr: ${data}`)
      }
    })
  })
}

const getHash = (str: string) =>
  createHash('sha256').update(str).digest('hex').slice(0, 16)

type Range = [startTime: number, duration: number]

const parseSegments = (segment: string): Range => {
  //format hh:mm:ss-duration
  let match = segment.match(/(\d{2}):(\d{2}):(\d{2})-(\d+)/)
  if (match !== null) {
    const [_i, hrs, min, sec, duration] = Array.from(match, val => +val)
    return [(hrs * 60 + min) * 60 + sec, duration]
  }

  //format startTime-duration
  match = segment.trim().match(/^(\d+)-(\d+)/)
  if (match !== null) {
    return Array.from(match, val => +val).splice(1) as Range
  }

  return [0, 0]
}

//prettier-ignore
var argv = optimist
  .alias('i', 'input').describe('i', 'video source link')
  .alias('p', 'path').describe('p', 'change destination path').default('p', './tmp')
  .alias('q', 'quiet').describe('q', 'hide ffmpeg log').boolean('q').argv

const link = argv.input
const hash = getHash(link)
const ranges = argv._.map(parseSegments)
console.log(ranges)

const startProcess = async () => {
  try {
    await mkdir(argv.path)
    for (const range of ranges) {
      await download(link, range, argv.path, hash)
    }
  } catch (e) {
    console.log('error', e)
  }
}

startProcess()
