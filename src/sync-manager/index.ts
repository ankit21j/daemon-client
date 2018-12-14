import * as logger from "winston"

import { batches } from "../uid-job/job"

import {
  fetchUniqueMfd,
  fetchConsumedProducts,
  fetchAuthToken,
  markAsSynced
} from "../db-operations/sku-store"
// import { fetchAuthToken } from "../db-operations/client-config"

import { IProductItem } from "../interfaces/sku-store"

import axios from "axios"

const MAX_PER_REQ = 1000
let authToken

export const main = async () => {
  // init sync manager

  authToken = await fetchAuthToken()

  logger.info("inside sync manager")
  await fetchCodesToActivate()
  schedule()
}

const schedule = async () => {
  await fetchCodesToActivate()

  logger.info("schedule sync manager every 10mins")
  setTimeout(async () => {
    await schedule()
  }, 10 * 60 * 1000)
}

const fetchCodesToActivate = async () => {
  const uniqueMfdArray = await fetchUniqueMfd()
  const activationObj: object[] = []

  for (const mfd of uniqueMfdArray) {
    const result = await fetchConsumedProducts(mfd)

    if (result) {
      let skip = 0
      let limit = 0

      for (const { value } of batches(
        Object.keys(result).length,
        MAX_PER_REQ
      )) {
        limit += value

        let productResults: IProductItem[] = []
        productResults = result.slice(skip, limit)

        skip += value

        let productsArray: string[] = []

        productsArray = productResults.map((item: any, index) => {
          return item.numericCode
        })

        const date = new Date(mfd)

        date.setMonth(date.getMonth() + 3)
        const expiry = date.getTime()

        const params = {
          products: productsArray,
          mfd: mfd,
          expiry: expiry
        }

        activationObj.push(params)
      }
    }
  }

  await activateCodes(activationObj)
}

const activateCodes = async activationObjs => {
  const activationProgress = 0

  for (const activationObj of activationObjs) {
    await axios
      .post(
        `https://devserver.supplytics.com/inventory/products/activate`,
        activationObj,
        { headers: { authToken: authToken } }
      )
      .then(async response => {
        if (response.status === 200 && response.data.success) {
          await markAsSynced(activationObj.products)
          // activationProgress += 1;
          // logger.info('activated code');
        }
      })
      .catch(error => {
        logger.error(error)
      })
  }

  // if(activationProgress === activationObjs.length){
  // logger.info('update synced to true')
  // }
}
