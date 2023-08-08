const API_URL = 'http://localhost:3000'
let counter = 0
function parseNDJSON() {
  let buffer = ''
  return new TransformStream({
    transform(chunk, controller) {
      buffer += chunk
      // only handling cases where 2 items comes in single chunk
      const items = buffer.split('\n')
      // if (!items[0]) return

      items.slice(0, -1).forEach(item => controller.enqueue(JSON.parse(item)))

      controller.enqueue(JSON.parse(items[0]))
      buffer = items[items.length - 1]
    },
    flush(controller) {
      // flush is similar to _final in csvToNSJON.js file
      if (!buffer.length) return
      controller.enqueue(JSON.parse(buffer))
    }
  })
}
async function* consumeAPI(signal) {
  const response = await fetch(API_URL, { signal })

  const stream = response.body
  // stream
  //   .pipeThrough(new TextDecoderStream())
  //   .pipeThrough(parseNDJSON())
    
    const reader = stream.getReader()
  
  // let done = false
  try {
    while(true) {
      const { value, done} = await reader.read()
      // done = res.done
      if(done) {
        
        console.log('Stream finished!')
        break;
      }
      console.log(`Value`, { value })
  
      yield value
      // const data = Buffer.from(res.value).toString('utf-8').split('\n')
  
      // for(const item of data) {
      //   if(!item) continue
  
      //   yield item
      // }
    }
  } catch (error) {
    reader.releaseLock()
  } /* while (!done); */
  //   // Transfor buffer to Readable form. on Node.js we've Readable.from(), but on browser we've TextDecoderStream()
  //   // .pipeThrough(new TextDecoderStream())
  //   // .pipeThrough(parseNDJSON())
  // // .pipeTo(
  // //   new WritableStream({
  // //     write(chunk, controller) {
  // //       console.log(`Chunk`, chunk)
  // //     }
  // //   })
  // // )

  // return reader
}


function print(log) {
  return async function* (stream) {
    for await (const chunk of stream) {
      log(`[writable]:${chunk.toString()}`)
    }
  }
}

function appendToHTML(element) {
  return new WritableStream({
    write({ title, description, url }, contoller) {
      // We're already parsing JSON on parseNDJSON pipeline
      console.log(`Chunk`)
      const card = ` 
      <article>
        <div class="text">
          <h2>${++counter}. ${title}</h2>
          <p>${description.slice(0, 100)}</p>
          <a href="${url}">Link</a>
        </div>
      </article>`

      element.innerHTML += card
    }
  })
}

const [start, stop, cards] = ['start', 'stop', 'cards'].map((item) => document.getElementById(item))

let abortController = new AbortController()

start.addEventListener('click', async () => {
  try {
    // const readableStream = await consumeAPI(abortController.signal)
    // console.log({ readableStream })

    for await(const item of consumeAPI(abortController.signal)) {
      console.log('Checking value', item, item.toString())
    }

    // new ReadableStream(await consumeAPI(abortController.signal))
    //   .pipeThrough(new TextDecoderStream())
    //   .pipeThrough(parseNDJSON())
    //   .pipeTo(appendToHTML(cards))
    // await readableStream.pipeTo(appendToHTML(cards))
  } catch (error) {
    console.log(`Error occured!`, error)
  }
})

stop.addEventListener('click', () => {
  abortController.abort()
  console.log('Stream Fetching Aborted!!')
  abortController = new AbortController() // we might ending up clicking start and end again and again
  counter = 0
})

/*   .pipeTo(
    new WritableStream({
      write(chunk, controller) {
        console.log(`Chunk`, chunk)
      }
    })
  ) */
