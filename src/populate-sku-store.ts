import * as logger from "winston"

import { db } from "./db"

import { populateSkuStore } from "./db-operations/sku-store"

let clientConfig = {}

export const initSkuStore = () => {
  db.collection('clientConfig').find({ 'authToken' : { '$exists' : true }}).toArray(async (err, items) => {
    if(err){
      logger.error(err)
    }
    setDefaults((items))
  })
}

const setDefaults = async(req) => {

  //default client config
  clientConfig = Object.assign({}, req[0])
  
  let enabledSkus = clientConfig['skus']['enabledSkus']
  let enabledLines = clientConfig['lines']['enabledLines']

  for(let sku in enabledSkus){
    let skuCode = enabledSkus[sku]
    for(let lineId of enabledLines){
      await populateSkuStore(skuCode, lineId, clientConfig['uidLimits']['maxPerFile'], clientConfig['uidLimits']['backupPerSku'])
    }
  }
}
