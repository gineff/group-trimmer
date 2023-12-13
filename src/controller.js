import { Countdown } from './countdown.js'

export class Controller {
  constructor({ trimmers, retries = 30, concurrentStreams, timeout = 60 }) {
    this.total = trimmers.length
    this.trimmers = trimmers
    this.timeout = timeout
    this.retries = retries
    let streams = Math.min(concurrentStreams, this.total)
    while (streams--) {
      this.startTrimmer(this.trimmers.shift())
    }
  }
  startTrimmer(trimmer, retries = this.retries) {
    const countdown = new Countdown(this.timeout)
    countdown.on('timeUp', () =>
      this.handleError({ trimmer, retries, countdown }),
    )

    trimmer.on('close', () => this.handleClose(countdown))
    trimmer.on('error', () => this.handleError({ trimmer, retries, countdown }))
    trimmer.on('data', (data) => this.handleData({ countdown, data }))

    trimmer.start()
  }
  handleClose(countdown) {
    countdown.removeAllListeners()
    this.total--

    if (this.trimmers.length) {
      this.startTrimmer(this.trimmers.shift())
    } else if (!this.total) {
      // eslint-disable-next-line no-process-exit
      process.exit(1)
    }
  }
  handleError({ trimmer, retries, countdown }) {
    countdown.removeAllListeners()
    retries--
    trimmer.stop()
    if (retries > 0) {
      this.startTrimmer(trimmer, retries)
    }
  }
  handleData({ countdown }) {
    countdown.reset()
  }
}
