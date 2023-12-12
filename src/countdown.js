import { EventEmitter } from 'node:events'

export class Countdown extends EventEmitter {
  constructor(initialTime) {
    super()
    this.initialTime = initialTime
    this.rest = initialTime
    this.timerId = null
  }

  start() {
    this.timerId = setInterval(() => {
      this.rest--

      if (this.rest < 0) {
        this.stop()
        this.emit('timeUp')
      }
    }, 1000)
  }

  stop() {
    clearInterval(this.timerId)
    this.timerId = null
  }

  reset() {
    this.stop()
    this.rest = this.initialTim
    this.start()
  }
}
