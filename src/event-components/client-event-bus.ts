import { createEventBus } from "ts-event-bus"
import { centralEvents } from "../central-event-bus"
import { WebSocketClientChannel } from "../web-socket-channel"

import * as logger from "winston"

export const EventBus = createEventBus({
  events: centralEvents,
  channels: [new WebSocketClientChannel("ws://127.0.0.1:7000")]
})
