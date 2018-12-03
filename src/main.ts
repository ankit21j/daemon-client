// import * as app from "./app"
// import * as http from "http"
// import * as WebSocket from "ws"

import * as logger from "winston"

import * as dbManager from "./db"

// const connectionUri: string = "mongodb://mongo/test-client-db"
const connectionUri: string = "mongodb://localhost:27017/test-client-db"

import { main  as clientMain } from "./client-configurations/client-config"

import { main as dbMain , insertDoc, updateDoc } from "./db-operations/client-config"

const main = async () => {
  
  // connect to mongodb
  const dbObject = await connectToMongo(connectionUri, 3)

  let clientConfigObj = await clientMain() 

  // get clientConfig collection
  let clientCollection = await dbMain(dbObject)

  // if config exists, update else insert
  clientCollection.find({ 'authToken' : { '$exists' : true }}).toArray(async (err, items) => {
    if(err){
      logger.error(err)
    }
    if(items.length === 0){
      await insertDoc(clientCollection, clientConfigObj)
    } else {
      await updateDoc(clientCollection, clientConfigObj)
    }
  })


}

const connectToMongo = async (uriConnect: string, retryNumber: number) => {
  try {
    const dbConnection = await dbManager.connect(uriConnect)
    logger.info("Successfully connected to mongodb")

    dbConnection.on("close", () => {
      logger.error("Error! Mongo closed")
      retryMongoConnection(uriConnect, retryNumber)
    })
    return dbConnection
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
