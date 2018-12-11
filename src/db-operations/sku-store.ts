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

export const insertSkuDocs = (skuDoc) => {
  if(!skuDoc.isPicked){
    skuDoc.isPicked = false
  }
  if(!skuDoc.isUsed){
    skuDoc.isUsed = false
  }
  if(!skuDoc.isSynced){
    skuDoc.isSynced = false
  }
  if(!skuDoc.batchId){
    skuDoc.batchId = null
  }
  if(!skuDoc.mfd){
    skuDoc.mfd = null
  }
  if(!skuDoc.expiry){
    skuDoc.expiry = null
  }

  console.log(skuDoc)

  return new Promise((resolve, reject) => {
    db.collection('skuStore').insertOne(skuDoc, (err, docs) => {
      if(err){
        logger.error(err)
        reject(err)
      }
      console.log(docs)
      resolve(docs)
    })  
  })

}

export const insertProductDetails = (doc) => {
  return new Promise((resolve, reject) => {
    db.collection('skuStore').insertMany(doc, (err, docs) => {
      if(err){
        logger.error(err)
        reject(err)
      }
      // console.log()
      resolve(docs)
    })
  })
}
