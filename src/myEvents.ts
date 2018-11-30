import { slot, Slot } from "ts-event-bus"

export const MyEvents = {
  sayHello: slot<string>(),
  getTime: slot<string>(),
  multiply: slot<{num1: number, num2: number}, number>(),
  ping: slot<void>(),
}