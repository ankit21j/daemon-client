import * as logger from "winston"
import * as chokidar from "chokidar"

import { EventBus } from "../client-event-bus"

const filePath = '/Users/ankitgupta/Documents/wireframes'

const watcher = chokidar.watch(filePath, {
  ignored: /(^|[\/\\])\../,
  persistent: true
});

watcher
  .on('add', (path) => {
    EventBus.pickupFileAdded((`${path}`))
      .then(() => {
        logger.info("do nothing")
      })
      .catch(error => {
        logger.error("error!!!!")
        logger.error(error)
      })
  })
  .on('unlink', (path) => {
    EventBus.pickupFileRemoved((`${path}`))
      .then(() => {
        logger.info("add new file to folder")
      })
      .catch(error => {
        logger.error("error!!!!")
        logger.error(error)
      })
  })

logger.info("inside client child")
