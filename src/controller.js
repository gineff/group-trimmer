import { Countdown } from './countdown.js'

export class Controller {
  currentIndex = 0
  constructor({ trimmers, retries = 10, concurrentStreams = 3, timeout = 60 }) {
    this.trimmers = trimmers
    this.timeout = timeout
    this.retries = retries

    for (
      let i = 0;
      i < Math.min(concurrentStreams, this.trimmers.length);
      i++
    ) {
      this.currentIndex++
      this.startTrimmer(trimmers.at(i))
    }
  }
  startTrimmer(trimmer, retries = this.retries) {
    const countdown = new Countdown(this.timeout)
    console.log('countdown', typeof countdown)
    countdown.on('timeUp', () => this.handleError({ trimmer, retries, countdown }))

    trimmer.on('close', () => this.handleClose(countdown))
    trimmer.on('error', () => this.handleError({ trimmer, retries, countdown }))
    trimmer.on('data', () => this.handleData({ countdown }))

    trimmer.trim()
  }
  handleClose(countdown) {
    countdown.removeAllListeners()
    this.currentIndex++
    if (this.currentIndex < this.trimmers.length) {
      this.startTrimmer(this.trimmers.at(this.currentIndex))
    }
  }
  handleError({ trimmer, retries, countdown }) {
    countdown.removeAllListeners()
    retries--

    if (retries > 0) {
      this.startTrimmer(trimmer, retries)
    }
  }
  handleData({ countdown }) {
    countdown.reset()
  }
}
