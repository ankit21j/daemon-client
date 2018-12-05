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


// fetch client config from db
export const fetchClientConfig = (db) => {
  return new Promise((resolve, reject) => {
    db.collection('clientConfig').findOne({}, (err, doc) => {
        if(err){
          logger.error(err)
          reject(err)
        }
        // console.log(doc)
        resolve(doc)
      })
  })
}

// fetch enabled skus from db
export const fetchEnabledSkus = (db) => {
  return new Promise((resolve, reject) => {
    db.collection('clientConfig').find({}).project({'_id':0,'skus.enabledSkus' : 1 }).toArray((err, doc) =>{
        if(err){
          logger.error(err)
          reject(err)
        }
        resolve(doc[0]['skus']['enabledSkus'])
      })
  })
}

// fetch client config from db
export const fetchEnabledLines = (db) => {
  return new Promise((resolve, reject) => {
    db.collection('clientConfig').find({}).project({'_id':0,'lines.enabledLines' : 1 }).toArray((err, doc) =>{
        if(err){
          logger.error(err)
          reject(err)
        }
        resolve(doc[0]['lines']['enabledLines'])
      })
  })
}

// fetch max file size config from db
export const fetchMaxPerFile = (db) => {
  return new Promise((resolve, reject) => {
    db.collection('clientConfig').find({}).project({'_id':0,'uidLimits.maxPerFile' : 1 }).toArray((err, doc) =>{
        if(err){
          logger.error(err)
          reject(err)
        }
        resolve(doc[0]['uidLimits']['maxPerFile'])
      })
  })
}