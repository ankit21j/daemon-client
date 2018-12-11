import * as logger from "winston"
import { createSkuStore, findAllDocuments } from "./sku-store"


export const checkCollection = (db, collName) => {
  return new Promise((resolve, reject) => {
    db.listCollections({name: collName})
      .next(async(err, collinfo) => {
            if (collinfo) {
              resolve(true)
            }else if(!collinfo){
              await createSkuStore(db)
              resolve(true)
            }
            if(err){
              logger.error(err)
              reject(err)
            }
          })
    });
}


