// import * as app from "./app"
// import * as http from "http"
// import * as WebSocket from "ws"

import * as logger from "winston"

import * as dbManager from "./db"

import { clientParent } from "./event-components/client-parent-event"
import { serverParent } from "./event-components/server-parent-event"

// const connectionUri: string = "mongodb://mongo/test-client-db"
const connectionUri: string = "mongodb://localhost:27017/test-client-db"

const main = async () => {
  // connect to mongodb
  connectToMongo(connectionUri, 3)
  clientParent()
  serverParent()
}

const connectToMongo = async (uriConnect: string, retryNumber: number) => {
  try {
    const dbConnection = await dbManager.connect(uriConnect)
    logger.info("Successfully connected to mongodb")

    dbConnection.on("close", () => {
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
