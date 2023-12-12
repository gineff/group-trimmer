import pathToFfmpeg from 'ffmpeg-static'
import { spawn } from 'node:child_process'
import { EventEmitter } from 'node:events'
import ini from 'ini'

export class Trimmer extends EventEmitter {
  ffmpegOptions
  constructor({ input, range, output }) {
    super()
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
    this.trim()
  }
  trim() {
    const ffmpeg = spawn(pathToFfmpeg, this.ffmpegOptions)

    ffmpeg.on('close', code => {
      this.emit('close', code)
    })

    ffmpeg.on('error', e => {
      this.emit('error', e)
    })

    ffmpeg.stdout.on('data', data => {
      const {
        bitrate,
        total_size: totalSize,
        out_time_ms: outTimeMs,
        progress,
      } = ini.decode(data.toString())
      this.emit('data', { bitrate, totalSize, outTimeMs, progress })
    })
  }
}


const trimmer = new Trimmer({
  input:
    '/media/anri/b8f61008-4cfd-4018-a3c6-1689ab220721/torrents/18VR_Hitting_the_H1gh_Note_oculus_180_180x180_3dh_LR.mp4',
  range: ['00:00:00', 1],
  output: 'test.mp4',
})

trimmer.on('data', console.log)
