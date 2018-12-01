// import { fork } from "child_process"
// import * as fs from "fs"
import * as logger from "winston"
import { EventBus } from "./server-event-bus"


export const serverParent = () => {
  logger.info("server parent")
}

// listen to client emitted events
EventBus.pickupFileAdded.on((fileName) => {
  logger.info(`server parent line13 ,${fileName}`)
})

EventBus.pickupFileRemoved.on((fileName) => {
  logger.info(`server parent line17 ,${fileName}`)
})