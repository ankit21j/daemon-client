import { createEventBus } from "ts-event-bus"
import { centralEvents } from "../central-event-bus"
import { WebSocketServerChannel } from "../web-socket-channel"

import * as logger from "winston"

export const EventBus = createEventBus({
  events: centralEvents,
  channels: [new WebSocketServerChannel(7000)]
})
