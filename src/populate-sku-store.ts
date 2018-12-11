import * as logger from "winston"

import { db } from "./db"

import { event } from "./events"

import { checkCollection } from "./db-operations/collection-list"

import { createSkuStore, findAllDocuments } from "./db-operations/sku-store"

import { computeActiveBackup } from "./deficit-manager/compute-backup"

export const initSkuStore = async(channel) => {

  // let enabledSkus, enabledLines,maxPerFile

  let props = {
    enabledSkus : {},
    enabledLines : {},
    uidLimits : {}
  }

  channel.pub(event.FETCH_SKUS)

  channel.sub(event.SKUS_RECEIVED, skus => {
    props = {
      ...props,
      enabledSkus : Object.assign({},props.enabledSkus, skus)
    }
  })

  channel.pub(event.FETCH_LINES)

  channel.sub(event.LINES_RECEIVED, lines => {
    props = {
      ...props,
      enabledLines : Object.assign({},props.enabledLines, lines)
    }
  })

  channel.pub(event.FETCH_UID_LIMITS)

  channel.sub(event.UID_LIMITS_RECEIVED, uidLimits => {
    props = {
      ...props,
      // maxPerFile : maxPerFile
      uidLimits : Object.assign({},props.uidLimits, uidLimits)
    }
  })

  setTimeout(async() =>{
    // find respective collections and populate store
    await populateSkuStore(props, channel)
  },5000)

}


const populateSkuStore = async(props, channel) => {

  // check if skuStore collection exists 
  let skuStoreExists = await checkCollection(db, 'skuStore')

  if(!skuStoreExists){
    // create collection
    await createSkuStore(db)
    skuStoreExists = true    
  }

  // console.log(props)

  for(let sku in props['enabledSkus']){
    let skuStoreDocs = await computeActiveBackup(channel,db,props['enabledSkus'][sku], props['uidLimits'])
  }

}
