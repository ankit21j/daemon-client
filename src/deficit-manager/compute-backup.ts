import { event } from "../events"

import * as logger from "winston"
import { getActiveBackupCount } from "../db-operations/sku-store"


export const computeActiveBackup = async(channel, db, sku, uidLimits) => {

  let backupPerSku = uidLimits['backupPerSku']
  let skuBackupCount = await getActiveBackupCount(db, sku['code'])

  if(skuBackupCount < backupPerSku){
    console.log('populate sku store')

    //populate sku store by emitting event.ADD_JOB
    let requiredVol = backupPerSku - Number(skuBackupCount)
    let data = { selectedSku: sku, volume: requiredVol}

    channel.pub(event.ADD_JOB, data) 

  }else{
    console.log('deliver files')
  }
  
}