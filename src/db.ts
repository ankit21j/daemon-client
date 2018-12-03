import * as logger from "winston"
import * as mongo from "mongodb"
// import * as mongoose from "mongoose"

const MongoClient = mongo.MongoClient

export let db

export const connect = async (connectionUri: string): Promise<mongo.Db> => {
  const client = await MongoClient.connect(connectionUri, {
    useNewUrlParser: true,
    ignoreUndefined: true
  })
  db = client.db()
  return db
}
