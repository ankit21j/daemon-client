import * as logger from "winston"

export interface ISkuStore {
  jobId: string
  skuName: string
  skuCode: string
  numericCode: string
  serialNo: string
  qrcodeData: string
  batchId?: string
  mfd?: number
  expiry?: number
  picked: boolean
  delivered: boolean
  consumed: boolean
  synced: boolean
}
