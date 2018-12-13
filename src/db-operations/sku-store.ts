import * as logger from "winston"

import { skuStore } from "../interfaces/sku-store"
import { db } from "../db";


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

export const getActiveBackupCount = (skuCode) => {
  return new Promise((resolve, reject) => {
    db.collection('skuStore').find({'skuCode' : skuCode, 'picked' : false, 'delivered' : false, 'consumed' : false, 'synced' : false}).count({},(err, count) => {
      if(err){
        logger.error
        reject(err)
      }
      resolve(count)
    })
  })
}

export const insertSkuDocs = (data) => {
  return new Promise((resolve, reject) => {
    db.collection('skuStore').insertOne(data, (err, docs) => {
      if(err){
        logger.error(err)
        reject(err)
      }
      resolve(docs)
    })  
  })

}

export const findUnusedDocs = (skuCode, maxPerFile) => {
  return new Promise((resolve, reject) => {
    db.collection('skuStore').find({'skuCode' : skuCode, 'picked' : false, 'delivered' : false, 'consumed' : false, 'synced' : false}).limit(maxPerFile).toArray((err, docs) => {
      if(err){
        logger.error(err)
        reject(err)
      }
      resolve(docs)
    })
  })
}

export const updateBatchId = (mongoIdArray, batchId) => {
  return new Promise((resolve, reject) => {
    db.collection('skuStore').update({'_id' : { '$in' : mongoIdArray }}, { '$set' : { 'batchId' : batchId, 'picked' : true }}, {'multi' : true},(err, docs) => {
      if(err){
        logger.error(err)
        reject(err)
      }
      resolve(docs)
    })
  })
}

export const updateDeliveredStatus = (batchId) => {
  return new Promise((resolve, reject) => {
    db.collection('skuStore').update({'batchId' : batchId, 'picked' : true}, { '$set' : { 'delivered' : true }}, {'multi' : true},(err, docs) => {
      if(err){
        logger.error(err)
        reject(err)
      }
      resolve(docs)
    })
  })
}
