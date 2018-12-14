import * as fsExtra from "fs-extra"
import * as fs from "fs"

import * as logger from "winston"
import * as moment from "moment"

import { PATH_VARIABLES } from "../constants"

import { markAsConsumed } from "../db-operations/sku-store"

export const main = async() => {
  // init reporting manager

  const reportingDir = PATH_VARIABLES.reporting

  start(reportingDir)
}

const start = async(reportingDir) => {
  await schedule(reportingDir)
}

const schedule = async(reportingDir) => {
  await getAllfiles(reportingDir)
    .then(async(res) => {
      for(let element of Object.keys(res)){
        const filenameArray = res[element].split('_');
        if(filenameArray[4] === 'log.json'){
          const fileObj = {
            jobId : filenameArray[0],
            lineId : filenameArray[1],
            skuCode : filenameArray[2]
          }

          let logFile = reportingDir + '/' + res[element];
          await readLogFile(logFile, fileObj, res[element]);
        }
      };

      setTimeout(async() => {
          await schedule(reportingDir);
      }, 20000);
  }).catch(error => {
    logger.error(error)
  });
}

const getAllfiles = (logpath) =>{
  return new Promise((resolve, reject) => {
      fsExtra.readdir(logpath, (error, filenames) => {
        if(error){
          logger.error(`${error}`)
          reject(error)
        }
      resolve(filenames)
    })
  })
}

const readLogFile = async(logFile, fileObj, logFileName) => {

  let logFileNameArray = logFile.split('/')
  // let logFileName = logFileNameArray[logFileNameArray.length -1]

  fsExtra.readJson(logFile)
  .then(async(data) => {
    await processLogFile(data, fileObj, logFileName)
  })
  .catch((error) => {
    logger.error(error)
  })
}

const processLogFile = async(data, fileObj, logFileName) => {
     
    let objLength = data.length - 1
    console.log(objLength, fileObj)

    // get corressponding txt file from delivery directory
    let deliveryFilePath = await getDeliveredFile(logFileName)

    // read delivered file
    let deliveredFileObj = await readDeliveredFile(deliveryFilePath)

    let mfdObj = data[objLength].manufacturingDate
    let mfd = await getMfdTimestamp(mfdObj)
    let date = new Date(mfd);
    
    date.setMonth(date.getMonth() + 3);
    let expiry = date.getTime();

    let logDatetime = data[objLength].datetime;
    logDatetime = moment(logDatetime, 'DD.MM.YYYY HH:mm:ss')

    let logTimestamp = logDatetime.unix() * 1000

    let productFound = false;
    let lastPrintedCode = data[objLength].lastPrinteDUID
    console.log(lastPrintedCode)
    console.log('---------')

    while(!productFound){
      // find indexOf productCode in delivered text file
      let productIndex = deliveredFileObj.indexOf(lastPrintedCode)
      if(productIndex > -1){
        productFound = true
      }
      
      if(productFound){
        let printedCodes = deliveredFileObj.slice(0, productIndex + 1)

        await markAsConsumed(printedCodes, mfd, expiry, logTimestamp)

      } else if(objLength > 0) {
        objLength -= 1;
        lastPrintedCode = data[objLength].lastPrinteDUID
      } else if(objLength <= 0) {
        productFound = true;
      }
    }

    //     // find lastPrintedUid wrt to jobId in local DB
    //     [productFound, lastJobId, lastCreatedAt] = await findLocalUid(jobId, skuCode ,lastPrintedCode)
    //     if(productFound){
    //       // Sync with server

    //       await fetchCodesToActivate(logFileName, skuCode, lastJobId, lastCreatedAt, mfd)

    //     } else if(objLength > 0) {
    //       objLength -= 1;
    //       lastPrintedCode = obj[objLength].lastPrinteDUID
    //     } else if(objLength <= 0) {
    //       productFound = true;
    //     }
    //   }
}

// const findLocalUid = async(displayId, skuCode, lastPrintedCode) => {
//   // query to find code in localdb wrt jobid

//   let productIdData = await initDb.findOneByProductCode(displayId, skuCode, lastPrintedCode)
//   console.log(productIdData)


//   if(productIdData){
//     return [true, productIdData.jobId, productIdData.createdAt]
//   }else{
//     return [false,false,false]
//   }
// }



const getDeliveredFile = async(fileName) => {
  
  fileName = fileName.replace("_log.json", ".txt")
  const filePath = PATH_VARIABLES.delivery
  let deliveryFileArray = await getAllfiles(filePath)

  return new Promise<string>((resolve, reject) => {
    if (Object.values(deliveryFileArray).indexOf(fileName) > -1) {
      let deliveryFilePath = filePath + '/' + fileName
      resolve(deliveryFilePath)
    }
    reject(false)
  })
}


const readDeliveredFile = async(deliveredFile) => {
  return new Promise<string[]>(resolve => {
    const stream = fs.createReadStream(deliveredFile, {encoding : 'utf8'})
    let streamObject
    stream.on('data', data => {
      streamObject = data.split(/\n/)
      stream.destroy();
    })
    stream.on('close', () => {
      resolve(streamObject);
    });
  })

}

const getMfdTimestamp = async(mfd) => {
  mfd = mfd.split(/[\s.]+/)
  return new Promise<number>((resolve, reject) => {
    try {
      const mfdDate = moment().date(mfd[0]).format('D')
      const mfdMonth = moment().date(mfd[1]).format('M')
      const mfdYear = moment().date(mfd[2]).format('Y')
    
      const mfdString = mfdYear + '-' + mfdMonth + '-' + mfdDate
      const mfdObject = moment(mfdString, 'Y.M.D') 
    
      const mfdTimestamp = mfdObject.unix() * 1000
  
      resolve(mfdTimestamp)
    } catch (error) {
      logger.error(error)
    }
  })
}