import { Countdown } from './countdown.js'

export class Controller {
  currentIndex = 0
  constructor({ trimmers, retries = 30, concurrentStreams, timeout = 60 }) {
    this.trimmers = trimmers
    this.timeout = timeout
    this.retries = retries

    for (
      let i = 0;
      i < Math.min(concurrentStreams || trimmers.length, this.trimmers.length);
      i++
    ) {
      this.currentIndex++
      this.startTrimmer(trimmers.at(i))
    }
  }
  startTrimmer(trimmer, retries = this.retries) {
    console.log('trimmer start', trimmer)
    const countdown = new Countdown(this.timeout)
    countdown.on('timeUp', () => this.handleError({ trimmer, retries, countdown }))

    trimmer.on('close', () => this.handleClose(countdown))
    trimmer.on('error', () => this.handleError({ trimmer, retries, countdown }))
    trimmer.on('data', (data) => this.handleData({ countdown, data }))

    trimmer.trim()
  }
  handleClose(countdown) {
    countdown.removeAllListeners()
    this.currentIndex++
    if (this.currentIndex < this.trimmers.length) {
      this.startTrimmer(this.trimmers.at(this.currentIndex))
    }else{
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
  handleData({ countdown, data }) {
    countdown.reset()
  }
}
