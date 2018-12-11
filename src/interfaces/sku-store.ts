import * as logger from "winston"

export interface skuStore {
  jobId : string,
  skuName : string,
  skuCode : string,
  numericCode : string,
  serialNo : string,
  qrcodeData : string,
  batchId? : string,
  mfd? : number,
  expiry? : number,
  isPicked : boolean,
  isUsed : boolean,
  isSynced : boolean
}