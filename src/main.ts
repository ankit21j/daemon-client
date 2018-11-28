import * as app from "./app"
import * as logger from "winston"

import * as dbManager from "./db"

const connectionUri: string = "mongodb://127.0.0.1:27017/test-client-db"
// const db = "test-client-db"

const main = async () => {
  const server = app.listen(app.get("port"), err => {
    if (err) {
      logger.error("Server error", err)
      throw err
    }
    logger.info("listening on port ", app.get("port"))
  })

  connectToMongo(connectionUri, 3)
}

const connectToMongo = async (uriConnect: string, retryNumber: number) => {
  try {
    await dbManager.connect(uriConnect)
    logger.info("Successfully connected to mongodb")
    return
  } catch (error) {
    logger.error("\n", error)

    // retry to connect to server
    if (retryNumber > 0) {
      connectToMongo(uriConnect, retryNumber - 1)
    }
    return
  }
}

main()
