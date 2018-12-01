import { fork } from "child_process"
import * as fs from "fs"
import * as logger from "winston"

import { watcherMain } from "./client-events/watchers"
// fork(`${__dirname}/client-events/watcher-clients`) 


export const clientParent = () => {
  logger.info("client parent")
  watcherMain()
}
