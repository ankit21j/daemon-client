import * as logger from "winston"

export const main = db => {
  // initialize the collection if not
  const clientCollection = db.collection("clientConfig")
  return clientCollection
}

export const insertDoc = (collection, data) => {
  const jsonData = JSON.parse(data)

  collection
    .insertOne(jsonData)
    .then(result => {
      return result
    })
    .catch(error => {
      logger.error(error)
      throw error
    })
}

export const updateDoc = (collection, data) => {
  const jsonData = JSON.parse(data)

  collection
    .updateOne({ authToken: { $exists: true } }, { $set: jsonData })
    .then(result => {
      return result
    })
    .catch(error => {
      logger.error(error)
      throw error
    })
}

// fetch client config from db
export const fetchClientConfig = db => {
  return new Promise((resolve, reject) => {
    db.collection("clientConfig").findOne({}, (err, doc) => {
      if (err) {
        logger.error(err)
        reject(err)
      }
      resolve(doc)
    })
  })
}

// fetch enabled skus from db
export const fetchEnabledSkus = db => {
  return new Promise((resolve, reject) => {
    db
      .collection("clientConfig")
      .find({})
      .project({ _id: 0, "skus.enabledSkus": 1 })
      .toArray((err, doc) => {
        if (err) {
          logger.error(err)
          reject(err)
        }
        resolve(doc[0].skus.enabledSkus)
      })
  })
}

// fetch enabled lines from db
export const fetchEnabledLines = db => {
  return new Promise((resolve, reject) => {
    db
      .collection("clientConfig")
      .find({})
      .project({ _id: 0, lines: 1 })
      .toArray((err, doc) => {
        if (err) {
          logger.error(err)
          reject(err)
        }
        resolve(doc[0].lines.enabledLines)
      })
  })
}

// fetch max file size config from db
export const fetchUidLimits = db => {
  return new Promise((resolve, reject) => {
    db
      .collection("clientConfig")
      .find({})
      .project({ _id: 0, uidLimits: 1 })
      .toArray((err, doc) => {
        if (err) {
          logger.error(err)
          reject(err)
        }
        resolve(doc[0].uidLimits)
      })
  })
}
