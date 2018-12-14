import * as fsExtra from "fs-extra"
import * as fs from "fs"
import * as path from "path"

import * as logger from "winston"
import * as moment from "moment"

import { PATH_VARIABLES } from "../constants"

import { markAsConsumed } from "../db-operations/sku-store"

let processedLogDir

export const main = async () => {
  // init reporting manager
  const reportingDir = PATH_VARIABLES.reporting
  processedLogDir = PATH_VARIABLES.reporting + "/o4s-processed-logs/"
  if (!fs.existsSync(processedLogDir)) {
    fs.mkdirSync(processedLogDir)
  }

  start(reportingDir)
}

const start = async reportingDir => {
  await schedule(reportingDir)
}

const schedule = async reportingDir => {
  await getAllfiles(reportingDir)
    .then(async res => {
      for (const element of Object.keys(res)) {
        const filenameArray = res[element].split("_")
        if (filenameArray[4] === "log.json") {
          const fileObj = {
            jobId: filenameArray[0],
            lineId: filenameArray[1],
            skuCode: filenameArray[2]
          }

          const logFile = reportingDir + "/" + res[element]

          await readLogFile(logFile, fileObj, res[element])
        }
      }

      setTimeout(async () => {
        await schedule(reportingDir)
      }, 6 * 60 * 1000)
    })
    .catch(error => {
      logger.error(error)
    })
}

const getAllfiles = logpath => {
  return new Promise((resolve, reject) => {
    fsExtra.readdir(logpath, (error, filenames) => {
      if (error) {
        logger.error(`${error}`)
        reject(error)
      }
      resolve(filenames)
    })
  })
}

const readLogFile = async (logFile, fileObj, logFileName) => {
  const logFileNameArray = logFile.split("/")

  fsExtra
    .readJson(logFile)
    .then(async data => {
      await processLogFile(data, fileObj, logFileName)
    })
    .catch(error => {
      logger.error(error)
    })
}

const processLogFile = async (data, fileObj, logFileName) => {
  let objLength = data.length - 1

  // get corressponding txt file from delivery directory
  const deliveryFilePath = await getDeliveredFile(logFileName)

  // read delivered file
  const deliveredFileObj = await readDeliveredFile(deliveryFilePath)

  const mfdObj = data[objLength].manufacturingDate
  const mfd = await getMfdTimestamp(mfdObj)
  const date = new Date(mfd)

  date.setMonth(date.getMonth() + 3)
  const expiry = date.getTime()

  let logDatetime = data[objLength].datetime
  logDatetime = moment(logDatetime, "DD.MM.YYYY HH:mm:ss")

  const logTimestamp = logDatetime.unix() * 1000

  let productFound = false
  let lastPrintedCode = data[objLength].lastPrinteDUID
  logger.info(lastPrintedCode)
  logger.info("---------")

  while (!productFound) {
    // find indexOf productCode in delivered text file
    const productIndex = deliveredFileObj.indexOf(lastPrintedCode)
    if (productIndex > -1) {
      productFound = true
    }

    if (productFound) {
      const printedCodes = deliveredFileObj.slice(0, productIndex + 1)

      await markAsConsumed(printedCodes, mfd, expiry, logTimestamp)
        .then(async () => {
          const currentTimestamp = Date.now()
          const logFileArray = logFileName.split(".")
          const processedLogName =
            logFileArray[0] + "_" + currentTimestamp + "." + logFileArray[1]

          const savePath = path.join(
            PATH_VARIABLES.reporting + "/",
            logFileName
          )
          const filepath = path.join(processedLogDir, processedLogName)

          await fsExtra.move(savePath, filepath)
          logger.info(`Moving log file - ${logFileName} to processed dir`)
        })
        .catch(err => {
          logger.error(err)
        })
    } else if (objLength > 0) {
      objLength -= 1
      lastPrintedCode = data[objLength].lastPrinteDUID
    } else if (objLength <= 0) {
      productFound = true
    }
  }
}

const getDeliveredFile = async fileName => {
  fileName = fileName.replace("_log.json", ".txt")
  const filePath = PATH_VARIABLES.delivery
  const deliveryFileArray = await getAllfiles(filePath)

  return new Promise<string>((resolve, reject) => {
    if (Object.values(deliveryFileArray).indexOf(fileName) > -1) {
      const deliveryFilePath = filePath + "/" + fileName
      resolve(deliveryFilePath)
    }
    reject(false)
  })
}

const readDeliveredFile = async deliveredFile => {
  return new Promise<string[]>(resolve => {
    const stream = fs.createReadStream(deliveredFile, { encoding: "utf8" })
    let streamObject
    stream.on("data", data => {
      streamObject = data.split(/\n/)
      stream.destroy()
    })
    stream.on("close", () => {
      resolve(streamObject)
    })
  })
}

const getMfdTimestamp = async mfd => {
  mfd = mfd.split(/[\s.]+/)
  return new Promise<number>((resolve, reject) => {
    try {
      const mfdDate = moment()
        .date(mfd[0])
        .format("D")
      const mfdMonth = moment()
        .date(mfd[1])
        .format("M")
      const mfdYear = moment()
        .date(mfd[2])
        .format("Y")

      const mfdString = mfdYear + "-" + mfdMonth + "-" + mfdDate
      const mfdObject = moment(mfdString, "Y.M.D")

      const mfdTimestamp = mfdObject.unix() * 1000

      resolve(mfdTimestamp)
    } catch (error) {
      logger.error(error)
    }
  })
}
