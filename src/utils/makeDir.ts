import { mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'

export default  async(path: string) => {
  if (!existsSync(path)) {
    await mkdir(path)
  }
}
