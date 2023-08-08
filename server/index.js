import csvToJson from 'csvtojson'
import { createReadStream } from 'node:fs'
import { createServer } from 'node:http'
import { Readable, Transform } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import { TransformStream } from 'node:stream/web'
import { setTimeout } from 'node:timers/promises'
const PORT = process.env.PORT || 3000

async function* customReadable(readableStream) {
    for await(const chunk of readableStream) {
    console.log('For Loop Chunk', { chunk })
    yield chunk
    await setTimeout(1000)
  }
}

async function* customWritable(stream) {
  for await(const chunk of stream) {
    console.log(`[customWritable]:`, chunk.toString())
    

  }

  // return new WritableStream({
  //   write(chunk) {
  //     res.write(chunk)
  //   }
  // })
}

createServer(async (req, res) => {
  /* Adding CORS */
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': '*'
  }

  if (req.method === 'OPTIONS') {
    res.writeHead(204, headers)
    res.end()
    return
  }

  let items = 0
  const abortController = new AbortController()

  req.once('close', () => {
    console.log(`Connection was closed ${items} processed...!`)
    abortController.abort() // we have to abort otherwise, server will keep sending stream even after client disconection,
  })

  try {
    res.writeHead(200, headers)
    // await Readable.toWeb(createReadStream('./animeflv.csv'))
    //   .pipeThrough(Transform.toWeb(csvToJson()))
    //   .pipeThrough(
    //     new TransformStream({
    //       transform(chunk, controller) {
    //         const data = JSON.parse(Buffer.from(chunk))
    //         const mappedData = JSON.stringify({
    //           title: data.title,
    //           description: data.description,
    //           url: data.url_anime
    //         }).concat('\n')

    //         controller.enqueue(mappedData)
    //       }
    //     })
    //   )
    //   .pipeTo(
    //     new WritableStream({
    //       async write(chunk) {
    //         await setTimeout(1000)
    //         items++
    //         res.write(chunk)
    //       },
    //       close() {
    //         res.end()
    //       }
    //     }),
    //     { signal: abortController.signal } // To abort the controller, once connection closed, line:27
    //   )
    console.log('Im here')
    const readableStream = Readable.toWeb(createReadStream('./animeflv.csv'))
      .pipeThrough(Transform.toWeb(csvToJson()))
      .pipeThrough(
        new TransformStream({
          transform(chunk, controller) {
            console.log('Tranformer', chunk)
            const data = JSON.parse(Buffer.from(chunk))
            const mappedData = JSON.stringify({
              title: data.title,
              description: data.description,
              url: data.url_anime
            })

            controller.enqueue(mappedData)
          }
        }),
        // { signal: abortController.signal }
      )

      await pipeline(Readable.from(customReadable(readableStream)), res, { signal: abortController.signal })
    // Readable.from(customReadable(readableStream)).pipe(res)
    // for await(const item of customReadable(readableStream)) {
    //   console.log('Readable Read', { item })
      
    //   new WritableStream({
    //     write(chunk) {
    //       res.write(chunk)
    //     },
    //     close() {
    //       res.end()
    //     }
    //   })
    // }

    // await pipeline(customReadable, customWritable, { signal: abortController.signal })
  } catch (error) {
    console.log(`Error`, error.code, error.message)
    // if (error.code !== 'ABORT_ERR') throw error
  }
})
  .listen(PORT)
  .on('listening', () => console.log(`Server is listening on port ${PORT}`))
