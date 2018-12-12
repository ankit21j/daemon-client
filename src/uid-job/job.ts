import * as moment  from "moment";
import fs = require("fs");
import path = require("path");

import axios from "axios"
import * as logger from "winston"

import { insertSkuDocs } from "../db-operations/sku-store"

import { skuStore } from "../interfaces/sku-store"

const STATE = {
  RUNNING : "RUNNING",
  COMPLETE : "COMPLETE",
  ABORTED : "ABORTED",
  PAUSED : "PAUSED"
}
const TIME_FORMAT = "YYYY-MM-DD-hh:mm:ss"
let MAX_PER_REQ = 1000


export const create = async (sku, volume, authToken, plantId ) => {

  let id = await generateId(sku, volume, authToken, plantId)

  return {
    id,
    sku,
    volume,
    progress: 0,
    state: STATE.RUNNING,
  }
}

const generateId = (sku, volume, authToken, plantId) => {

  let params = {
    skuCode : sku.code,
    volume : volume,
    plantUid : plantId
  }

  return Promise.resolve(
    axios.post('https://devserver.supplytics.com/inventory/uid-job',params, { 'headers': { 'authToken': authToken } })
    .then(function (response) {
      return response.data.data.uid;
    })
    .catch(function (error) {
      logger.error(error)
    })
  )

}

export const start = async (job, onProgress, sku, authToken) => {

  let runFlag = true;
  
  let progress = 0 
  // let productDetailsArray : Array<object> = []

  for (let { value } of batches(job.volume, MAX_PER_REQ)){
    
    try{

      if(runFlag){   
        let productArray = await fetchProducts(job.id, value, authToken)

        for(let product of productArray.products) {
          let skuDoc : skuStore = {
            jobId : job.id,
            skuName : sku.name,
            skuCode : sku.code,
            numericCode : product.numericCode,
            qrcodeData : product.qrcodeData,
            serialNo : product.serialNo,
            picked : false,
            delivered : false,
            consumed : false,
            synced : false
          }

          await insertSkuDocs(skuDoc)
          // productDetailsArray.push(skuDoc)
        }
        progress += value
        onProgress( { id: job.id, progress, state: progress === job.volume ? STATE.COMPLETE : STATE.RUNNING })
      
        if(productArray.job.status === 'COMPLETE' || productArray.job.status === 'ABORTED' ){
          runFlag = false;
          break;
        }
      }
    } catch(error) {
      logger.error(error)

      onProgress({ id: job.id, progress, state:STATE.ABORTED })
      // await initJobHistory.insertIntoDb(job.id,job.displayId, job.sku.code, job.sku.name,job.lineId,job.volume, STATE.ABORTED)
      break
    }
  }

  if(progress === job.volume){
    console.log('job complete....')
  }

  return job
}


const fetchProducts = async (uid, volume, authToken) => {

  const params = {
    volume,
    uid
  }
  return Promise.resolve(
    axios.post(`https://devserver.supplytics.com/inventory/uid-job/execute`, params, { 'headers': { 'authToken': authToken }})
      .then(response => {
        return response.data.data;
      })
      .catch(error => {
        logger.error(error)
      })
  )
}

function* batches(volume, batchSize) {
  let parts = Math.ceil(volume / batchSize)

  for (let i = 0; i < parts; i++) {
    yield { value: Math.min(volume, batchSize), index: i }
    volume -= batchSize
  }
}

const stitch = (...args) => {
  return args
    .map(str => {
      if (typeof str.toString !== "function") {
        return ""
      }
      return str
        .toString()
        .toLowerCase()
        .replace(/\W/g, "")
    })
    .join("-")
}


