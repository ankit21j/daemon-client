import * as logger from "winston"
import { EventBus } from "./server-event-bus"

export const serverParent = () => {
  logger.info("server parent")
}

// listen to client emitted events

// file added to pickup dir
EventBus.pickupFileAdded.on(fileName => {
  logger.info(`server parent line14 ,${fileName}`)
})

// file removed to pickup dir
EventBus.pickupFileRemoved.on(fileName => {
  logger.info(`server parent line19 ,${fileName}`)
})


// file added to reporting dir
EventBus.reportingFileAdded.on(fileName => {
  logger.info(`server parent line25 ,${fileName}`)
})

// file changed in reporting dir
EventBus.reportingFileChanged.on(fileName => {
  logger.info(`server parent line30 ,${fileName}`)
})

// file removed to reporting dir
EventBus.reportingFileRemoved.on(fileName => {
  logger.info(`server parent line35 ,${fileName}`)
})
