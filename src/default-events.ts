import { event } from "./events"
import * as logger from "winston"

export const initEvents = channel => {
  channel.pub(event.FETCH_SKUS)

  channel.pub(event.FETCH_LINES)

  return
}
