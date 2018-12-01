import * as logger from "winston"
import * as chokidar from "chokidar"

import { EventBus } from "../client-event-bus"

const pickupPath = "/Users/ankitgupta/Documents/test-vj/Laser"

const reportingPath = "/Users/ankitgupta/Documents/test-vj/Laser/LaserLog"

const pickupWatcher = chokidar.watch(pickupPath, {
  ignored: /(^|[\/\\])\../,
  depth: 0,
  persistent: true,
  ignoreInitial: true,    //ignore events on files present beforehand
  cwd: pickupPath         //defines the file base location to get only the affected file
})

const reportingWatcher = chokidar.watch(reportingPath, {
  ignored: /(^|[\/\\])\../,
  depth: 0,
  persistent: true,
  ignoreInitial: true,    //ignore events on files present beforehand
  cwd: reportingPath      //defines the file base location to get only the affected file
})


// Pickup watcher
pickupWatcher
  .on("add", path => {
    EventBus.pickupFileAdded(`${path}`)
      .then(() => {
        // new file added
      })
      .catch(error => {
        logger.error(error)
      })
  })
  .on("unlink", path => {
    EventBus.pickupFileRemoved(`${path}`)
      .then(() => {
        // file removed, add a new file  
      })
      .catch(error => {
        logger.error(error)
      })
  })


// Reporting watcher
reportingWatcher
  .on("add", path => {
    EventBus.reportingFileAdded(`${path}`)
      .then(() => {
        // new file added
      })
      .catch(error => {
        logger.error(error)
      })
  })
  .on("change", path => {
    EventBus.reportingFileChanged(`${path}`)
      .then(() => {
        // new file added
      })
      .catch(error => {
        logger.error(error)
      })
  })
  .on("unlink", path => {
    EventBus.reportingFileRemoved(`${path}`)
      .then(() => {
        // file removed, add a new file  
      })
      .catch(error => {
        logger.error(error)
      })
  })


  // Delivered Watcher


  // Buffer watcher
