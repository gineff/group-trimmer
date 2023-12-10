export default (filename: string) =>
  filename.slice(((filename.lastIndexOf('.') - 1) >>> 0) + 2)
