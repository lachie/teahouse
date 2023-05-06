import { Node } from '../house'
import { RuntimeContext } from '../runtime'
import { PublishingDevice } from './pubDevice'

const commandMap = {
    idle: 'i',
    up: 'u',
    down: 'd',
    sit: '1',
    stand: '2',
} as const
export type DeskCommand = keyof typeof commandMap
type DeviceCommand = (typeof commandMap)[DeskCommand]

export type DeskNode = Node & {
  type: 'deskctl'
  key: string
  topic: string
  payload: DeskCommand
}

export class DeskCtl<Msg> extends PublishingDevice<Msg, DeskCommand, DeskNode> {
  static make(
    key: string,
    topic: string,
    payload: DeskCommand,
  ): DeskNode {
    return {
      type: 'deskctl',
      key,
      topic,
      payload,
    }
  }

  transformPayload({ payload }: DeskNode): DeviceCommand {
    return commandMap[payload]
  }

  publish({ mqttClient }: RuntimeContext<Msg>, device: DeskNode): void {
    console.log("mqtt:", `${device.topic}/ctl`, "pl", this.transformPayload(device))
    mqttClient.publish(
      `${device.topic}/ctl`,
      this.transformPayload(device),
    )
  }
}
