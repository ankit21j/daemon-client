import * as logger from "winston"
import { db } from "../db"

export const checkCollection = (collName) => {
  return new Promise((resolve, reject) => {
    db.listCollections({name: collName})
      .next(async(err, collinfo) => {
            if (collinfo) {
              resolve(true)
            }else if(!collinfo){
              await createDbCollection(collName)
              resolve(false)
            }
            if(err){
              logger.error(err)
              reject(err)
            }
          })
    });
}


export const createDbCollection = (collName) => {
  return new Promise((resolve, reject) => {
    db.createCollection(collName, (err, collection) => {
      if(err){
        logger.error(err)
        reject(err)
      }
      resolve(collection)
    })
  })
}

