import { slot, Slot } from "ts-event-bus"

export const centralEvents = {
  pickupListAllFiles: slot<string>(),
  pickupFileAdded: slot<string>(), //pickup dir file addition
  pickupFileRemoved: slot<string, { lineId: string; skuCode: string }>(), //pickup dir file removal
  reportingFileAdded: slot<string>(), //reporting dir file addition
  reportingFileChanged: slot<string>(), //reporting dir file change
  reportingFileRemoved: slot<string>() //reporting dir file removal
}
