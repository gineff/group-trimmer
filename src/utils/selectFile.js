import inquirer from 'inquirer'

export const selectFile = async files => {
  if (!files) return Promise.reject(new Error('no files in torrent'))
  if (files.length === 1) return Promise.resolve(0)
  return new Promise(resolve => {
    inquirer
      .prompt([
        {
          type: 'list',
          name: 'fileIndex',
          message: 'Choose one file',
          choices: Array.from(files).map((file, i) => ({
            name: `[${i}] ${file.name} : ${file.length}`,
            value: i,
          })),
        },
      ])
      .then(response => {
        const { fileIndex } = response
        resolve(Number(fileIndex))
      })
      .catch(err => {
        console.error(err)
        process.exit(0)
      })
  })
}
