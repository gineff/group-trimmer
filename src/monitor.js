class Wrapper {
  constructor(trimmer) {
    this.trimmer = trimmer
  }
  toString() {
    const { outTimeMs } = this.trimmer.data
    const [startTime, duration] = this.trimmer.range
    const width = 70
    let progressText = ''
    let percentage = 0

    try {
      const value = outTimeMs > 0 ? outTimeMs / 1000000 : 0
      percentage = (value / duration) * 100
      const progress = Math.round((width * percentage) / 100)
      progressText = '='.repeat(progress).padEnd(width, ' ')
    } catch (e) {
      console.log(e)
    }

    return `[${progressText}] | ${(startTime + '-' + duration).padStart(
      7,
      ' '
    )} | ${Math.min(percentage.toFixed(2), 100.0)}% \r\n`
  }
}

export class Monitor {
  results = []
  constructor(trimmers) {
    trimmers.forEach(trimmer => {
      this.results.push(new Wrapper(trimmer))
      trimmer.on('data', this.render)
    })
  }
  render = () => {
    process.stdout.write('\x1Bc\r' + this.results.join(''))
    //process.stdout.write(this.results.join(''))
  }
}
