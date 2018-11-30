import * as app from "./app"
import * as http from "http"
import * as WebSocket from "ws"

import * as logger from "winston"

import * as dbManager from "./db"

import { WebSocketServerChannel } from "./webSocketChannel"

import { firstModule } from "./firstModule"
import { secondModule } from "./secondModule"

const connectionUri: string = "mongodb://127.0.0.1:27017/test-client-db"

import { EventBus } from './event-components/secondModule.EventBus'

const main = async () => {

  // EventBus.sayHello.on((name) => {
  //   logger.info('Server listening')
  //   logger.info(`${name} said hello!`)
  // })

  secondModule()

  setTimeout(() => {
    firstModule()
  }, 10000)

  // connect to mongodb
  connectToMongo(connectionUri, 3)

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
