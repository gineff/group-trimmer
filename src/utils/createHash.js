import { createHash } from 'node:crypto'

export const makeHash = (str) =>
  createHash('sha256').update(str).digest('hex').slice(0, 16)
