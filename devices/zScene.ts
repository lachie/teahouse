import { Device } from './device'
import { Node } from '../house'
import { RuntimeContext } from '../runtime'


export type ZSceneNode = Node & {
  type: 'zScene'
  topic: string
  sceneID: number
}

export class ZScene<Msg> extends Device<ZSceneNode, Msg> {
  static make(key: string, topic: string, sceneID: number): ZSceneNode {
    return {
      type: 'zScene',
      key,
      topic,
      sceneID
    }
  }

  add({ mqttClient }: RuntimeContext<Msg>, light: ZSceneNode) {
    console.log('zScene add', light)
    mqttClient.publish(`zigbee2mqtt/${light.topic}/set`, JSON.stringify({ scene_recall: light.sceneID }))
  }

  update(
    { mqttClient }: RuntimeContext<Msg>,
    light: ZSceneNode,
    prevLight: ZSceneNode,
  ) {
    console.log('zScene update', light)
    mqttClient.publish(`zigbee2mqtt/${light.topic}/set`, JSON.stringify({ scene_recall: light.sceneID }))
  }
}

