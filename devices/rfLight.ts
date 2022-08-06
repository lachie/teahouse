import { AsyncClient } from 'async-mqtt'
import { Device } from './device'
import { Node } from '../house'
import { RuntimeContext } from '../runtime'

export type RFLightNode = Node & {
  type: 'rfLight'
  key: string
  topic: string
  on: boolean
}

type Context = {
  mqttClient: AsyncClient
}

export class RFLight<Msg> extends Device<RFLightNode, Msg> {
  static make(key: string, topic: string, on: boolean): RFLightNode {
    return {
      type: 'rfLight',
      key,
      topic,
      on,
    }
  }

  add({ mqttClient }: RuntimeContext<Msg>, light: RFLightNode) {
    mqttClient.publish(light.topic, light.on ? '1' : '0')
  }

  update(
    { mqttClient }: RuntimeContext<Msg>,
    light: RFLightNode,
    prevLight: RFLightNode,
  ) {
    console.log('rfLight update', light)
    mqttClient.publish(light.topic, light.on ? '1' : '0')
  }
}
