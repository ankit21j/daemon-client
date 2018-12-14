import { event } from "../events"
import * as fs from "fs"
import * as _ from "lodash"
import * as uuid from "uuidv4"
import * as csvWriter from "csv-write-stream"
import * as fsExtra from "fs-extra"

import * as logger from "winston"

import {
  getActiveBackupCount,
  findUnusedDocs,
  updateBatchId,
  updateDeliveredStatus
} from "../db-operations/sku-store"

import { PATH_VARIABLES } from "../constants"

export const computeActiveBackup = async (
  channel,
  sku,
  uidLimits,
  enabledLines
) => {
  const backupPerSku = uidLimits.backupPerSku
  const maxPerFile = uidLimits.maxPerFile
  const skuBackupCount = await getActiveBackupCount(sku.code)

  if (skuBackupCount < backupPerSku) {
    logger.info("populate sku store")

    //populate sku store by emitting event.ADD_JOB
    const requiredVol = backupPerSku - Number(skuBackupCount)
    const data = { selectedSku: sku, volume: requiredVol }

    await channel.pub(event.ADD_JOB, data)
  }
  if (skuBackupCount >= maxPerFile) {
    const skuData = {
      selectedSku: sku
    }
    channel.pub(event.SKU_BACKUP_AVAILABLE, skuData)
  }
}

export const generateFiles = async (fileName, maxPerFile, channel) => {
  return new Promise(async (resolve, reject) => {
    const fileNameArray = fileName.split("_")
    const lineId = fileNameArray[0]
    const skuCode = fileNameArray[1]
    const batchId = await generateId()
    const displayId = batchId.split("-")[0]
    const outputFileName = [
      [displayId, lineId, skuCode, maxPerFile].join("_"),
      "txt"
    ].join(".")

    const dir = PATH_VARIABLES.buffer

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir)
    }

    const savePath = dir + "/" + outputFileName

    const writer = getCsvWriter(savePath)
    let writeProgress = 0

    // Find codes for skucode and the update with batchId
    const unusedDocs = await findUnusedDocs(skuCode, maxPerFile)
    const unusedIds: string[] = []

    for (const key of Object.keys(unusedDocs)) {
      writer.write({ numericCode: unusedDocs[key].numericCode })
      unusedIds.push(unusedDocs[key]._id)
      writeProgress += 1
    }

    if (writeProgress === maxPerFile) {
      await updateBatchId(unusedIds, batchId)

      const destPath = PATH_VARIABLES.delivery + "/" + outputFileName

      // move file to delivery directory
      fsExtra
        .move(savePath, destPath)
        .then(async () => {
          await updateDeliveredStatus(batchId)
          logger.info("File moved to delivered successfully")
          // channel.pub(event.SKU_STORE_CHANGED)
          resolve(destPath)
        })
        .catch(error => {
          logger.error(error)
          reject(error)
        })
    }
  })
}

const generateId = async () => {
  const id = uuid()
  return id
}

const getCsvWriter = savePath => {
  const writer = csvWriter({ sendHeaders: false })
  try {
    writer.pipe(fs.createWriteStream(savePath, { flags: "w" }))
    return writer
  } catch (error) {
    logger.error(error)
  }
}

// check if backup available is more than equal to the maxPerFile
export const checkBackupThreshold = async (fileName, maxPerFile) => {
  const fileNameArray = fileName.split("_")
  const skuCode = fileNameArray[2]
  const skuBackupCount = await getActiveBackupCount(skuCode)

  if (skuBackupCount <= maxPerFile) {
    logger.info("Backup is less than maxPerFile, cannot generate files")
    return Promise.resolve(false)
  }

  if (skuBackupCount > maxPerFile) {
    logger.info("Backup available, proceeding to generate file!")
    return Promise.resolve(true)
  }
}
