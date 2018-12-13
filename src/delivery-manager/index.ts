import * as chokidar from "chokidar"
import  * as fs from "fs"
import * as _ from "lodash"
import * as fsExtra from "fs-extra"

import * as logger from "winston"

import { event } from "../events"

import { PATH_VARIABLES } from "../constants"

import { generateFiles,checkBackupThreshold } from "../deficit-manager/compute-backup"

let props = {
  enabledSkus : {},
  enabledLines : {},
  uidLimits : {}
}

let basepath = PATH_VARIABLES.pickup

const pickupWatcher = chokidar.watch(PATH_VARIABLES.pickup, {
  ignored: /(^|[\/\\])\../,
  depth: 0,
  persistent: true,
  ignoreInitial: true,    //ignore events on files present beforehand
  cwd: PATH_VARIABLES.pickup         //defines the file base location to get only the affected file
})

  export const watcherMain = (channel) => {

    channel.sub(event.LINES_RECEIVED, enabledLines => {
      props = {
        ...props,
        enabledLines : Object.assign({},props.enabledLines, enabledLines)
      }
    })

    channel.sub(event.UID_LIMITS_RECEIVED, uidLimits => {
      props = {
        ...props,
        uidLimits : Object.assign({},props.uidLimits, uidLimits)
      }
    })

    // Pickup watcher
    pickupWatcher
    .on("unlink", async(path) => {
      let fileNameArray = path.split('_')
      let fileName = fileNameArray[1] + '_' + fileNameArray[2]
      await deficitFileManager(fileName,channel)

    })

    logger.info('watcher main')   
    channel.sub(event.SKU_BACKUP_AVAILABLE, async(data) => {
      console.log('sku backup available')
      console.log(data)
      await listFilesOnReady(channel, data.selectedSku)
    }) 

  }

  const listFilesOnReady = async(channel, sku) => {
    let fileNames:Array<string> = []
    // for(let sku in props['enabledSkus']){
      for(let line in props['enabledLines']){
        // let filename = props['enabledLines'][line] + '_' + props['enabledSkus'][sku]['code']
        let filename = props['enabledLines'][line] + '_' + sku['code']
        fileNames.push(filename)
      }  
    // let basepath = PATH_VARIABLES.pickup
    let missingFiles = await checkAllPresentFiles(fileNames, basepath)

    for(let key in missingFiles){
      await deficitFileManager(missingFiles[key],channel)
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

  // copy files from delivered to pickup
  const copyFiles = async(srcPath, destPath) => {
    try {
      await fsExtra.copy(srcPath, destPath)
      console.log('successfully copied to pickup dir!')
    } catch (err) {
      console.error(err)
    }
  }

  const deficitFileManager = async(fileName,channel) => {

    let backUpStatus = await checkBackupThreshold(fileName, props['uidLimits']['maxPerFile'])

    if(backUpStatus){
      let srcPath = await generateFiles(fileName, props['uidLimits']['maxPerFile'],channel)

      if(srcPath){
        let destPathArray: Array<string> = String(srcPath).split('/')
        let destPath = basepath + '/' + destPathArray[destPathArray.length - 1]
  
        console.log(srcPath, destPath)
        await copyFiles(srcPath, destPath)
      }
    }else{
      console.log('Cannot generate new files as backup is less than maxPerFile!')
    }

  }