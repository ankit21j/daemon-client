import * as logger from "winston"

import { db } from "../db"

import { IProductItem, IAuthToken } from "../interfaces/sku-store"

export const createSkuStore = () => {
  return new Promise((resolve, reject) => {
    db.createCollection("skuStore", (err, collection) => {
      if (err) {
        logger.error(err)
        reject(err)
      }
      resolve(collection)
    })
  })
}

export const fetchAuthToken = () => {
  return new Promise<IAuthToken>((resolve, reject) => {
    db
      .collection("clientConfig")
      .find({})
      .project({ _id: 0, authToken: 1 })
      .toArray((err, doc) => {
        if (err) {
          logger.error(err)
          reject(err)
        }
        resolve(doc[0].authToken)
      })
  })
}

export const findAllDocuments = () => {
  return new Promise((resolve, reject) => {
    db
      .collection("skuStore")
      .find({})
      .toArray((err, docs) => {
        if (err) {
          logger.error(err)
          reject(err)
        }
        resolve(docs)
      })
  })
}

export const getActiveBackupCount = skuCode => {
  return new Promise((resolve, reject) => {
    db
      .collection("skuStore")
      .find({
        skuCode: skuCode,
        picked: false,
        delivered: false,
        consumed: false,
        synced: false
      })
      .count({}, (err, count) => {
        if (err) {
          logger.error(err)
          reject(err)
        }
        resolve(count)
      })
  })
}

export const insertSkuDocs = data => {
  return new Promise((resolve, reject) => {
    db.collection("skuStore").insertOne(data, (err, docs) => {
      if (err) {
        logger.error(err)
        reject(err)
      }
      resolve(docs)
    })
  })
}

export const findUnusedDocs = (skuCode, maxPerFile) => {
  return new Promise((resolve, reject) => {
    db
      .collection("skuStore")
      .find({
        skuCode: skuCode,
        picked: false,
        delivered: false,
        consumed: false,
        synced: false
      })
      .limit(maxPerFile)
      .toArray((err, docs) => {
        if (err) {
          logger.error(err)
          reject(err)
        }
        resolve(docs)
      })
  })
}

export const updateBatchId = (mongoIdArray, batchId) => {
  return new Promise((resolve, reject) => {
    db
      .collection("skuStore")
      .update(
        { _id: { $in: mongoIdArray } },
        { $set: { batchId: batchId, picked: true } },
        { multi: true },
        (err, docs) => {
          if (err) {
            logger.error(err)
            reject(err)
          }
          resolve(docs)
        }
      )
  })
}

export const updateDeliveredStatus = batchId => {
  return new Promise((resolve, reject) => {
    db
      .collection("skuStore")
      .update(
        { batchId: batchId, picked: true },
        { $set: { delivered: true } },
        { multi: true },
        (err, docs) => {
          if (err) {
            logger.error(err)
            reject(err)
          }
          resolve(docs)
        }
      )
  })
}

export const markAsConsumed = (productArray, mfd, expiry, logTimestamp) => {
  return new Promise((resolve, reject) => {
    db.collection("skuStore").update(
      { numericCode: { $in: productArray }, consumed: false },
      {
        $set: {
          consumed: true,
          mfd: mfd,
          expiry: expiry,
          logTimestamp: logTimestamp
        }
      },
      { multi: true },
      (err, docs) => {
        if (err) {
          logger.error(err)
          reject(err)
        }
        resolve(docs)
      }
    )
  })
}

export const fetchUniqueMfd = () => {
  return new Promise<string[]>((resolve, reject) => {
    db
      .collection("skuStore")
      .distinct("mfd", { consumed: true, synced: false }, (err, docs) => {
        if (err) {
          logger.error(err)
          reject(err)
        }
        resolve(docs)
      })
  })
}

export const fetchConsumedProducts = mfd => {
  return new Promise<IProductItem[]>((resolve, reject) => {
    db
      .collection("skuStore")
      .find({ mfd: mfd, consumed: true, synced: false })
      .project({ _id: 0, numericCode: 1 })
      .toArray((err, docs) => {
        if (err) {
          logger.error(err)
          reject(err)
        }
        resolve(docs)
      })
  })
}

export const markAsSynced = productArray => {
  logger.info(productArray)
  return new Promise((resolve, reject) => {
    db
      .collection("skuStore")
      .update(
        { numericCode: { $in: productArray }, consumed: true, synced: false },
        { $set: { synced: true } },
        { multi: true },
        (err, docs) => {
          if (err) {
            logger.error(err)
            reject(err)
          }
          // logger.info(docs)
          resolve(docs)
        }
      )
  })
}
