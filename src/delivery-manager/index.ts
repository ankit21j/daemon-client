import * as chokidar from "chokidar"
import * as fs from "fs"
import * as _ from "lodash"
import * as fsExtra from "fs-extra"

import * as logger from "winston"

import { event } from "../events"

import { PATH_VARIABLES } from "../constants"

import {
  generateFiles,
  checkBackupThreshold
} from "../deficit-manager/compute-backup"

let props = {
  enabledSkus: {},
  enabledLines: {},
  uidLimits: {
    maxPerFile: 0,
    backupPerSku: 0
  }
}

const basepath = PATH_VARIABLES.pickup

const pickupWatcher = chokidar.watch(PATH_VARIABLES.pickup, {
  ignored: /(^|[\/\\])\../,
  depth: 0,
  persistent: true,
  ignoreInitial: true, //ignore events on files present beforehand
  cwd: PATH_VARIABLES.pickup //defines the file base location to get only the affected file
})

export const watcherMain = channel => {
  channel.sub(event.LINES_RECEIVED, enabledLines => {
    props = {
      ...props,
      enabledLines: Object.assign({}, props.enabledLines, enabledLines)
    }
  })

  channel.sub(event.UID_LIMITS_RECEIVED, uidLimits => {
    props = {
      ...props,
      uidLimits: Object.assign({}, props.uidLimits, uidLimits)
    }
  })

  // Pickup watcher
  pickupWatcher.on("unlink", async path => {
    const fileNameArray = path.split("_")
    const fileName = fileNameArray[1] + "_" + fileNameArray[2]
    await deficitFileManager(fileName, channel)
  })

  logger.info("watcher main")
  channel.sub(event.SKU_BACKUP_AVAILABLE, async data => {
    logger.info("sku backup available")
    logger.info(data)
    await listFilesOnReady(channel, data.selectedSku)
  })
}

const listFilesOnReady = async (channel, sku) => {
  const fileNames: string[] = []
  // for(let sku in props['enabledSkus']){
  for (const line of Object.keys(props.enabledLines)) {
    // let filename = props['enabledLines'][line] + '_' + props['enabledSkus'][sku]['code']
    const filename = props.enabledLines[line] + "_" + sku.code
    fileNames.push(filename)
  }
  // let basepath = PATH_VARIABLES.pickup
  const missingFiles = await checkAllPresentFiles(fileNames, basepath)

  for (const key of Object.keys(missingFiles)) {
    await deficitFileManager(missingFiles[key], channel)
  }
}

export const checkAllPresentFiles = (fileNames, sourcePath) => {
  let unprocessed: string[] = []
  const processed: string[] = []

  let presentFiles = fs.readdirSync(sourcePath)
  presentFiles = presentFiles.filter(files => files.includes(".txt"))
  for (const presentFile of presentFiles) {
    const presenFileArray = presentFile.split(/[\s_.]+/)
    if (presenFileArray[1] && presenFileArray[2]) {
      const presentFileName = presenFileArray[1] + "_" + presenFileArray[2]
      processed.push(presentFileName)
    }
  }

  unprocessed = _.difference(fileNames, processed)
  return unprocessed
}

// copy files from delivered to pickup
const copyFiles = async (srcPath, destPath) => {
  try {
    await fsExtra.copy(srcPath, destPath)
    logger.info("successfully copied to pickup dir!")
  } catch (err) {
    console.error(err)
  }
}

const deficitFileManager = async (fileName, channel) => {
  const backUpStatus = await checkBackupThreshold(
    fileName,
    props.uidLimits.maxPerFile
  )

  if (backUpStatus) {
    const srcPath = await generateFiles(
      fileName,
      props.uidLimits.maxPerFile,
      channel
    )

    if (srcPath) {
      const destPathArray: string[] = String(srcPath).split("/")
      const destPath = basepath + "/" + destPathArray[destPathArray.length - 1]

      // logger.info(srcPath, destPath)
      await copyFiles(srcPath, destPath)
    }
  } else {
    logger.info("Cannot generate new files as backup is less than maxPerFile!")
  }
}
