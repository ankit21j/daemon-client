// firstModule.ts
import * as logger from "winston"
import { EventBus } from "./event-components/firstModule.EventBus"

import { setTimeout } from "timers"

const main = () => {
  logger.info("firstModule")

  EventBus.sayHello("michel")
    .then(() => {
      logger.info("sayHello event triggered")
    })
    .catch(error => {
      logger.error("error!!!!")
      logger.error(error)
    })

  setTimeout(() => {
    EventBus.getTime("now")
      .then(time => {
        logger.info("getTime event triggered")
      })
      .catch(error => {
        logger.error("error!!!!")
        logger.error(error)
      })
  }, 5000)

  EventBus.multiply({ num1: 5, num2: 3 })
    .then(result => {
      logger.info(String(result))
    })
    .catch(err => {
      logger.error(err)
    })
}

export const firstModule = () => {
  main()
}
