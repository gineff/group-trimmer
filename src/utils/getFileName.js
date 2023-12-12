import { exec } from 'child_process'
import { promisify } from 'node:util'

export const getFileName = async filePath => {
  const promisifiedExec = promisify(exec)
  try {
    const { stdout, stderr } = await promisifiedExec(
      `ffprobe -v error -select_streams v:0 -show_entries format=filename -of default=noprint_wrappers=1:nokey=1 "${filePath}"`,
    )
    if (stderr) {
      throw new Error(stderr)
    }

    const fileName = stdout.trim()
    if (!fileName) throw Error
    return fileName
  } catch (error) {
    console.error('Ошибка при выполнении ffprobe:', error.message)
    return null
  }
}
