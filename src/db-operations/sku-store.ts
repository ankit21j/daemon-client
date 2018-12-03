import * as logger from "winston"

export const populateSkuStore = (skuCode, lineId, maxPerFile,backupPerSku ) => {
  console.log(skuCode, lineId, maxPerFile,backupPerSku)

  let volumeInserted = 0
  
  while(volumeInserted !== backupPerSku){
    console.log(volumeInserted)
    volumeInserted += maxPerFile
  }  
}


const createJob = () => {
  
}