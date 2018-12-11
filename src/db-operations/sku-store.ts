import * as logger from "winston"


export const createSkuStore = (db) => {
  return new Promise((resolve, reject) => {
    db.createCollection('skuStore', (err, collection) => {
      if(err){
        logger.error(err)
        reject(err)
      }
      resolve(collection)
    })
  })
}

export const findAllDocuments = (db) => {
  return new Promise((resolve, reject) => {
    db.collection('skuStore').find({}).toArray((err, docs) => {
      if(err){
        logger.error(err)
        reject(err)
      }
      resolve(docs)
    })
  })
}

export const getActiveBackupCount = (db, skuCode) => {
  return new Promise((resolve, reject) => {
    db.collection('skuStore').find({'skuCode' : skuCode, isPicked : false, isUsed : false, isSynced : false}).count({},(err, count) => {
      if(err){
        logger.error
        reject(err)
      }
      resolve(count)
    })
  })
}

// export const populateSkuStore = (skuCode, lineId, maxPerFile,backupPerSku ) => {
//   console.log(skuCode, lineId, maxPerFile,backupPerSku)

//   let volumeInserted = 0
  
//   while(volumeInserted !== backupPerSku){
//     console.log(volumeInserted)
//     volumeInserted += maxPerFile
//   }  
// }
