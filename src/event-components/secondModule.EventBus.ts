import { createEventBus } from "ts-event-bus"
import { MyEvents } from "../myEvents"
import { WebSocketServerChannel } from "../webSocketChannel"

import * as logger from "winston"

export const EventBus = createEventBus({
  events: MyEvents,
  channels: [
      new WebSocketServerChannel(7000)
  ]
})