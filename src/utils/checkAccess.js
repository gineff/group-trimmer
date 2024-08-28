import { access, constants } from 'fs'

export const checkAccess = (path) => {
  return new Promise((resolve) => {
    access(path, constants.W_OK, (err) => {
      if (err) {
        console.error(new Error(`Нет прав на запись по пути: ${path}`))
        // eslint-disable-next-line no-process-exit
        process.exit(1)
      } else {
        resolve(path)
      }
    })
  })
}
