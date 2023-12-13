import mime from 'mime'
import rangeParser from 'range-parser'
import express from 'express'
import cors from 'cors'

export const createServer = async (file) => {
  const app = express()
  app.use(express.json())
  app.use(cors())

  app.get('/', (request, response) => {
    response.setHeader('Accept-Ranges', 'bytes')
    response.setHeader('Content-Type', mime.getType(file.name) || 'text/plain')
    response.setHeader(
      'Content-Disposition',
      `attachment;filename="${file.name}"`,
    )

    const range = request.headers.range

    if (!range) {
      response.setHeader('Content-Length', file.length)
      if (request.method === 'HEAD') return response.end()
      const readStream = file.createReadStream()
      readStream.pipe(response)
    } else {
      const ranges = rangeParser(file.length, range)
      if (Array.isArray(ranges) && ranges.at(0) !== undefined) {
        const parsedRange = ranges.at(0)
        response.statusCode = 206
        response.setHeader(
          'Content-Length',
          parsedRange.end - parsedRange.start + 1,
        )
        response.setHeader(
          'Content-Range',
          'bytes ' +
            parsedRange.start +
            '-' +
            parsedRange.end +
            '/' +
            file.length,
        )
        if (request.method === 'HEAD') return response.end()
        const readStream = file.createReadStream(parsedRange)
        readStream.pipe(response)
      }
    }
  })

  return app
}
