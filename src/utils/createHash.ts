import { createHash } from 'node:crypto'

export default (str: string) =>
  createHash('sha256').update(str).digest('hex').slice(0, 16)
