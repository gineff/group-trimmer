import { mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'

export const makeDir =  async(path) => {
  if (!existsSync(path)) {
    await mkdir(path)
  }
}
