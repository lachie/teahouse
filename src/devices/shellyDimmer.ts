import { RuntimeContext } from '../runtime'
import { PublishingDevice } from './pubDevice'
import { Node } from '../house'

export type ShellyDimmerPayload = {
  state: boolean
}
export type ShellyDimmerNode = Node & {
  type: 'shellyDimmer'
  key: string
  topic: string
  payload: Partial<ShellyDimmerPayload>
}

export class ShellyDimmer<Msg> extends PublishingDevice<
  Msg,
  Partial<ShellyDimmerPayload>,
  ShellyDimmerNode
> {
  static make(
    key: string,
    topic: string,
    payload: Partial<ShellyDimmerPayload>,
  ): ShellyDimmerNode {
    return {
      type: 'shellyDimmer',
      key,
      topic,
      payload,
    }
  }

  publish({ mqttClient }: RuntimeContext<Msg>, device: ShellyDimmerNode): void {
    console.log('shelly dimmer publishing', device)
    if (device.payload.state === undefined) {
      return
    }

    mqttClient.publish(
      `shellies/${device.topic}/light/0/command`,
      device.payload.state ? 'on' : 'off',
    )
  }

  //   async add({ subMgr, schedMgr }: RuntimeContext<Msg>, p: ShellyNode) {
  //     // console.log('add', p.key, p.topic)
  //     subMgr.subscribe(
  //       p.key,
  //       `shellies/${p.topic}`,
  //       ({ message }: { message: string }) => {
  //         console.log('shelly', p.topic, message)
  //         // const { action } = JSON.parse(message)

  //         // if (action !== undefined) {
  //         //   const msg = p.onChange(action)

  //         //   schedMgr.dispatchMessage(msg)
  //         // }
  //       },
  //     )
  //   }

  //   async remove({ subMgr }: RuntimeContext<Msg>, p: ShellyNode) {
  //     subMgr.unsubscribe(p.key, `shellies/${p.topic}`)
  //   }
}
