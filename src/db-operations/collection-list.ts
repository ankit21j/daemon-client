import * as logger from "winston"

export const checkCollection = (db, collName) => {
  return new Promise((resolve, reject) => {
    db.listCollections({name: collName})
      .next(async(err, collinfo) => {
            if (collinfo) {
              resolve(true)
            }else if(!collinfo){
              await createDbCollection(db, collName)
              resolve(false)
            }
            if(err){
              logger.error(err)
              reject(err)
            }
          })
    });
}


export const createDbCollection = (db, collName) => {
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

