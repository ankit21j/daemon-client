import { event } from "../events"
import  * as fs from "fs"
import * as _ from "lodash"
import * as uuid from "uuidv4"
import * as csvWriter from "csv-write-stream"

import * as logger from "winston"
import { getActiveBackupCount,findUnusedDocs,updateBatchId } from "../db-operations/sku-store"

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

    channel.pub(event.ADD_JOB, data) 

  }
  if(skuBackupCount >= backupPerSku){
    console.log('deliver files to buffer')

    // check buffer dir and write to file
    let fileNames:Array<string> = []
    for(let line in enabledLines){
      let filename = enabledLines[line] + '_' + sku.code
      fileNames.push(filename)
    }

    let basepath = PATH_VARIABLES.buffer
    let missingFiles = await checkAllPresentFiles(fileNames, basepath)

    for(let key in missingFiles){
      await generateFiles(missingFiles[key], maxPerFile)
    }
  }
}


export const checkAllPresentFiles = (fileNames, basepath) => {

  let unprocessed: Array<string> = []
  let processed: Array<string> = []

  let presentFiles = fs.readdirSync(basepath);
  presentFiles = presentFiles.filter(f => f.includes(".txt"));
  for(let presentFile of presentFiles){
    let presenFileArray = presentFile.split(/[\s_.]+/);
    if(presenFileArray[1] && presenFileArray[2]){
      let presentFileName = presenFileArray[1] + '_' + presenFileArray[2];
      processed.push(presentFileName);
    }
  };

  unprocessed = _.difference(fileNames, processed);
  return unprocessed;
}


const generateFiles = async(fileName, maxPerFile) => {
  
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

  // Find codes for skucode and the update with batchId
  let unusedDocs = await findUnusedDocs(skuCode, maxPerFile)

  let unusedIds: Array<string> = []

  for(let key in unusedDocs){
    writer.write({numericCode: unusedDocs[key]['numericCode']})
    unusedIds.push(unusedDocs[key]['_id'])
  }

  await updateBatchId(unusedIds, batchId)
}


const generateId = () => {
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