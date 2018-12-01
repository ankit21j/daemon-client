import { fork } from "child_process"
import * as fs from "fs"
import * as logger from "winston"

const forked = fork(`${__dirname}/client-events/pickup-watcher`)

export const clientParent = () => {
  logger.info("client parent")
}
