import { fork } from "child_process"
import * as logger from "winston"
import { EventBus } from "./server-event-bus"

const pickupForked = fork(`./src/forked-processes/pickup-child/pickup-child`)



export const serverParent = () => {
  logger.info("server parent")
}

// listen to client emitted events

// list all files inside pickup folder, and generate missing files
EventBus.pickupListAllFiles.on(pickupLocation => {
  
  pickupForked.send(pickupLocation)
  
})

// file added to pickup dir
EventBus.pickupFileAdded.on(fileName => {
  logger.info(`${fileName} added`)
})

// file removed to pickup dir
EventBus.pickupFileRemoved.on((fileName) => {
  logger.info(`${fileName} removed`)
  return new Promise((resolve, reject) => {
    try {
      let fileNameArray = fileName.split('_')
      let lineId = fileNameArray[1]
      let skuCode = fileNameArray[2]
      logger.info(`${fileNameArray}`)

      resolve({lineId, skuCode})

    } catch (error) {
      reject(error)
    }
  })

})


// file added to reporting dir
EventBus.reportingFileAdded.on(fileName => {
  logger.info(`${fileName} added`)
})

// file changed in reporting dir
EventBus.reportingFileChanged.on(fileName => {
  logger.info(`${fileName} changed`)
})

// file removed to reporting dir
EventBus.reportingFileRemoved.on(fileName => {
  logger.info(`${fileName} removed`)
})
