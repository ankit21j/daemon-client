import * as logger from "winston"

export const main = (db) => {
  // initialize the collection if not 
  const clientCollection = db.collection('clientConfig')
  return clientCollection
}


export const insertDoc = (collection, data) => {
  
  let jsonData = JSON.parse(data)
  
  collection.insert(jsonData, (err, result) => {
    if(err){
      logger.error(err)
      return
    }
    return result
  })
}

export const updateDoc = (collection, data) => {
  
  let jsonData = JSON.parse(data)

  collection.update({ "authToken" : { "$exists" : true }} ,{ "$set" : jsonData }, (err, result) => {
    if(err){
      logger.error(err)
      return
    }
    return result
  })
}
