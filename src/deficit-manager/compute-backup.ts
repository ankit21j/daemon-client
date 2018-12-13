import { event } from "../events"
import  * as fs from "fs"
import * as _ from "lodash"
import * as uuid from "uuidv4"
import * as csvWriter from "csv-write-stream"
import * as fsExtra from "fs-extra"

import * as logger from "winston"

import { getActiveBackupCount,findUnusedDocs,updateBatchId, updateDeliveredStatus } from "../db-operations/sku-store"

import { PATH_VARIABLES } from "../constants"


export const computeActiveBackup = async(channel, db, sku, uidLimits, enabledLines) => {

  let backupPerSku = uidLimits['backupPerSku']
  let maxPerFile = uidLimits['maxPerFile']
  let skuBackupCount = await getActiveBackupCount(db, sku['code'])

  if(skuBackupCount < backupPerSku){
    console.log('populate sku store')

    //populate sku store by emitting event.ADD_JOB
    let requiredVol = backupPerSku - Number(skuBackupCount)
    let data = { selectedSku: sku, volume: requiredVol}

    await channel.pub(event.ADD_JOB, data) 
    console.log('here')
  }
  if(skuBackupCount >= backupPerSku){
    console.log('deliver files to buffer')
    let data = {
      selectedSku : sku,
      enabledLines : enabledLines
    }
    channel.pub(event.SKU_BACKUP_AVAILABLE, data)

    // check buffer dir and write to file
    // let fileNames:Array<string> = []
    // for(let line in enabledLines){
    //   let filename = enabledLines[line] + '_' + sku.code
    //   fileNames.push(filename)
    // }

    // let basepath = PATH_VARIABLES.buffer
    // let missingFiles = await checkAllPresentFiles(fileNames, basepath)

    // for(let key in missingFiles){
    //   await generateFiles(missingFiles[key], maxPerFile)
    // }
  }
}


// export const checkAllPresentFiles = (fileNames, basepath) => {

//   let unprocessed: Array<string> = []
//   let processed: Array<string> = []

//   let presentFiles = fs.readdirSync(basepath);
//   presentFiles = presentFiles.filter(f => f.includes(".txt"));
//   for(let presentFile of presentFiles){
//     let presenFileArray = presentFile.split(/[\s_.]+/);
//     if(presenFileArray[1] && presenFileArray[2]){
//       let presentFileName = presenFileArray[1] + '_' + presenFileArray[2];
//       processed.push(presentFileName);
//     }
//   };

//   unprocessed = _.difference(fileNames, processed);
//   return unprocessed;
// }


export const generateFiles = async(fileName, maxPerFile, channel) => {
  return new Promise(async(resolve, reject) => {

    let fileNameArray = fileName.split('_')
    let lineId = fileNameArray[0]
    let skuCode = fileNameArray[1]
    let batchId = await generateId()
    let displayId = batchId.split('-')[0];
    let outputFileName = [[ displayId,lineId, skuCode, maxPerFile].join('_'), "txt"].join(".")
  
    let dir = PATH_VARIABLES.buffer
  
    if (!fs.existsSync(dir)){
      fs.mkdirSync(dir);
    }
  
    let savePath = dir + '/' + outputFileName
  
    let writer  = getCsvWriter(savePath)
    let writeProgress = 0
  
    // Find codes for skucode and the update with batchId
    let unusedDocs = await findUnusedDocs(skuCode, maxPerFile)
    let unusedIds: Array<string> = []
  
    for(let key in unusedDocs){
      writer.write({numericCode: unusedDocs[key]['numericCode']})
      unusedIds.push(unusedDocs[key]['_id'])
      writeProgress += 1
    }
  
    if(writeProgress == maxPerFile){
      await updateBatchId(unusedIds, batchId)
  
      let destPath = PATH_VARIABLES.delivery + '/' + outputFileName
  
      // move file to delivery directory
      fsExtra.move(savePath, destPath)
        .then(async() => {
          await updateDeliveredStatus(batchId)
          console.log('File moved to delivered successfully')
          // channel.pub(event.SKU_STORE_CHANGED)
          resolve(destPath)
        })
        .catch(error => {
          logger.error(error)
          reject(error)
        });
    }
  })
  
}


const generateId = async() => {
  let id = uuid()
  return id
}


const getCsvWriter = (savePath) => {
  let writer = csvWriter({sendHeaders: false})
  try {
    writer.pipe(fs.createWriteStream(savePath, {flags: 'w'}))
    return writer
  } catch (error) {
    logger.error(error)
  }

}