import { event } from "./events"

import { create as createJob, start as startJob } from "./uid-job/job"

import * as logger from "winston"

import { db } from "./db"

import {
  fetchClientConfig,
  fetchEnabledSkus,
  fetchEnabledLines,
  fetchUidLimits
} from "./db-operations/client-config"

let clientConfig

const main = async () => {
  clientConfig = await fetchClientConfig(db)
}

const jobCreationManager = async channel => {
  channel.sub(event.FETCH_SKUS, async () => {
    try {
      // logger.info('state manager')
      const mapSkus = {}
      const skus = await fetchEnabledSkus(db)
      for (const sku of Object.keys(skus)) {
        mapSkus[sku] = skus[sku]
      }

      channel.pub(event.SKUS_RECEIVED, mapSkus)
    } catch (error) {
      logger.error(error)

      channel.pub(event.SKUS_RECEIVED, {})
    }
  })

  channel.sub(event.FETCH_LINES, async () => {
    try {
      const mapLines = {}
      const enabledLines = await fetchEnabledLines(db)

      for (const line of Object.keys(enabledLines)) {
        mapLines[line] = enabledLines[line]
      }

      channel.pub(event.LINES_RECEIVED, mapLines)
    } catch (error) {
      logger.error(error)

      channel.pub(event.LINES_RECEIVED, {})
    }
  })

  channel.sub(event.FETCH_UID_LIMITS, async () => {
    try {
      const uidLimits = await fetchUidLimits(db)

      channel.pub(event.UID_LIMITS_RECEIVED, uidLimits)
    } catch (error) {
      logger.error(error)

      channel.pub(event.UID_LIMITS_RECEIVED, {})
    }
  })

  channel.sub(event.ADD_JOB, async ({ selectedSku, volume }) => {
    const job = await createJob(
      selectedSku,
      volume,
      clientConfig.authToken,
      clientConfig.plantId
    )
    channel.pub(event.JOB_ADDED, job)
    startJob(
      job,
      progress => {
        channel.pub(event.JOB_PROGRESSED, progress)

        if (progress.state === "COMPLETE") {
          const data = {
            selectedSku: selectedSku
          }
          channel.pub(event.SKU_BACKUP_AVAILABLE, data)
        }
      },
      selectedSku,
      clientConfig.authToken
    )
  })
}

const jobListManager = channel => {
  const jobs = {}
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
