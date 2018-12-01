import { createEventBus } from "ts-event-bus"
import { MyEvents } from "../myEvents"
import { WebSocketClientChannel } from "../web-socket-channel"

import * as logger from "winston"

export const EventBus = createEventBus({
  events: MyEvents,
  channels: [new WebSocketClientChannel("ws://127.0.0.1:7000")]
})
