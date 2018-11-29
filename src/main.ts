import * as app from "./app"
import * as http from "http"
import * as WebSocket from "ws"

import * as logger from "winston"

import * as dbManager from "./db"

const server = http.createServer(app)

const wss = new WebSocket.Server({ server })

const connectionUri: string = "mongodb://127.0.0.1:27017/test-client-db"
// const db = "test-client-db"

const main = async () => {
  // establish a webSocket connection
  wss.on("connection", (ws: WebSocket) => {
    ws.on("message", (message: string) => {
      logger.info("received: %s", message)
      ws.send(`Hello, you sent -> ${message}`)
    })

    ws.send("Hi there, I am a WebSocket server")
  })

  server.listen(app.get("port"), err => {
    if (err) {
      logger.error("Server error", err)
      throw err
    }
    logger.info("listening on port ", app.get("port"))
  })

  // connect to mongodb
  connectToMongo(connectionUri, 3)
}

const connectToMongo = async (uriConnect: string, retryNumber: number) => {
  try {
    const mDb = await dbManager.connect(uriConnect)
    logger.info("Successfully connected to mongodb")
    mDb.on("close", () => {
      logger.error("Error! Mongo closed")
      retryMongoConnection(uriConnect, retryNumber)
    })
    return
  } catch (error) {
    logger.error("\n", error)

    // retry to connect to server
    retryMongoConnection(uriConnect, retryNumber)
    return
  }
}

const retryMongoConnection = (uriConnect, retryNumber) => {
  if (retryNumber > 0) {
    setTimeout(() => {
      connectToMongo(uriConnect, retryNumber - 1)
    }, 10000)
  }
}

main()
