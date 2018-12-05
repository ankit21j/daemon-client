import { event } from "./events"
import axios from "axios"

import { create as createJob, start as startJob} from "./uid-job/job"

import * as logger from "winston"

import { db } from "./db"

import { fetchClientConfig, fetchEnabledSkus, fetchEnabledLines, fetchMaxPerFile } from "./db-operations/client-config"

let clientConfig

const main = async() => {

  clientConfig = await fetchClientConfig(db)

}
 
const jobCreationManager = async(channel) => {

  channel.sub(event.FETCH_SKUS, async() => {
    try {
      
      console.log('state manager')
      let mapSkus = {}
      let skus = await fetchEnabledSkus(db)

      for( let skuName in skus){
        mapSkus[skuName] = skus[skuName]
      }

      channel.pub(event.SKUS_RECEIVED, mapSkus)
    } catch (error) {
      logger.error(error)

      channel.pub(event.SKUS_RECEIVED, {})
    }
  })

  channel.sub(event.FETCH_LINES, async() => {
    try {

      let mapLines = {}
      let enabledLines = await fetchEnabledLines(db)

      for( let line in enabledLines){
        mapLines[line] = enabledLines[line]
      }

      channel.pub(event.LINES_RECEIVED, mapLines)
    } catch (error) {
      logger.error(error)

      channel.pub(event.LINES_RECEIVED, {})
    }
  })

  channel.sub(event.FETCH_MAX_FILE_SIZE, async() => {
    try {

      let maxPerFile = await fetchMaxPerFile(db)

      channel.pub(event.MAX_FILE_SIZE_RECEIVED, maxPerFile)
    } catch (error) {
      logger.error(error)

      channel.pub(event.MAX_FILE_SIZE_RECEIVED, {})
    }
  })

  channel.sub(event.ADD_JOB, async ({ selectedSku, volume, lineId }) => {
    let job = await createJob(selectedSku, volume, lineId, clientConfig['authToken'], clientConfig['plantId'] )
    channel.pub(event.JOB_ADDED, job)
    startJob(job, (progress) => {
      channel.pub(event.JOB_PROGRESSED, progress)
    })
  })
}

const jobListManager = channel => {
  let jobs = {}
  channel.sub(event.JOB_ADDED, job => {
    jobs[job.id] = job
    channel.pub(event.UPDATE_JOB_LIST, Object.values(jobs))
  })

  channel.sub(event.JOB_PROGRESSED, ({ id, progress, state }) => {
    Object.assign(jobs[id], { progress, state })
    channel.pub(event.UPDATE_JOB_LIST, Object.values(jobs))
  })
}


export const stateManager = channel => {
  main()
  jobCreationManager(channel)
  jobListManager(channel)
}