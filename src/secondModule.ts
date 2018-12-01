// secondModule.ts
import { EventBus } from "./event-components/secondModule.EventBus"
import * as logger from "winston"

export const secondModule = () => {
  logger.info("second Module")
}

EventBus.sayHello.on(name => {
  logger.info("Server listening")
  logger.info(`${name} said hello!`)
})

EventBus.getTime.on(time => {
  logger.info("Server listening getTime")
})

EventBus.multiply.on(
  ({ num1, num2 }) =>
    new Promise((resolve, reject) => {
      try {
        resolve(num1 * num2)
      } catch (error) {
        reject(error)
      }
    })
)
