import { Countdown } from './countdown.js'

export class Controller {
  constructor({ trimmers, retries = 30, concurrentStreams, timeout = 30 }) {
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

    trimmer.on('close', (closeCode) => {
      if (closeCode === 0) {
        this.handleClose(countdown)
      }
    })
    trimmer.on('error', (error) =>
      this.handleError({ trimmer, retries, countdown, error }),
    )
    trimmer.on('data', (data) => this.handleData({ countdown, data }))

    trimmer.start()
    countdown.start()
  }
  handleClose(countdown) {
    countdown.stop()
    countdown.removeAllListeners()
    this.total--
    if (this.trimmers.length > 0) {
      this.startTrimmer(this.trimmers.shift())
    } else if (!this.total) {
      // eslint-disable-next-line no-process-exit
      process.exit(0)
    }
  }
  handleError({ trimmer, retries, countdown, error }) {
    if (error) {
      console.error(error)
    }
    retries--
    if (retries > 0) {
      trimmer.restart()
      countdown.reset()
    } else {
      this.handleClose(countdown)
    }
  }
  handleData({ countdown }) {
    countdown.reset()
  }
}
