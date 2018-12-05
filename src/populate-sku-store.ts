import * as logger from "winston"

import { db } from "./db"

import { stateManager } from "./state-manager"
import { createChannel } from "./pubsub"

import { event } from "./events"

import { populateSkuStore } from "./db-operations/sku-store"

export const initSkuStore = async(channel) => {

  let enabledSkus, enabledLines,maxPerFile

  channel.pub(event.FETCH_SKUS)

  channel.sub(event.SKUS_RECEIVED, skus => {
    enabledSkus = Object.assign({}, skus)
  })

  channel.pub(event.FETCH_LINES)

  channel.sub(event.LINES_RECEIVED, lines => {
    enabledLines = Object.assign({}, lines)
  })

  channel.pub(event.FETCH_MAX_FILE_SIZE)

  channel.sub(event.MAX_FILE_SIZE_RECEIVED, maxPerFile => {
    maxPerFile = maxPerFile
  })

}
