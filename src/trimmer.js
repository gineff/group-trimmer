import ini from 'ini'
import { spawn } from 'node:child_process'
import { EventEmitter } from 'node:events'

export class Trimmer extends EventEmitter {
  ffmpegOptions
  data
  constructor({ input, range, output, log }) {
    super()
    this.range = range
    this.log = log
    const [startTime, duration] = range

    this.ffmpegOptions = [
      '-ss',
      `${startTime}`,
      '-i',
      input,
      '-t',
      `${duration}`,
      '-c',
      'copy',
      '-progress',
      'pipe:1',
      '-y',
      output,
    ]
  }
  start() {
    const ffmpeg = spawn('ffmpeg', this.ffmpegOptions)
    this.ffmpeg = ffmpeg

    ffmpeg.on('close', (code) => {
      this.emit('close', code)
    })

    ffmpeg.on('error', (e) => {
      this.emit('error', e)
    })

    this.log &&
      ffmpeg.stderr.on('data', (data) => {
        console.error(`ffmpeg: ${data}`)
      })

    ffmpeg.stdout.on('data', (data) => {
      const {
        bitrate,
        total_size: totalSize,
        out_time_ms: outTimeMs,
        progress,
      } = ini.decode(data.toString())
      this.data = { bitrate, totalSize, outTimeMs, progress }
      this.emit('data', { bitrate, totalSize, outTimeMs, progress })
    })
  }
  stop() {
    this.ffmpeg.kill()
  }
  restart() {
    this.stop()
    this.start()
  }
}
