import { slot, Slot } from "ts-event-bus"

export const centralEvents = {
  pickupFileAdded: slot<string>(),
  pickupFileRemoved: slot<string>()
  // pickupDirectory: slot<string>()</string>
}
