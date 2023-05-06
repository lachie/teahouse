import { Device } from './device'
import { Node } from '../house'
import { RuntimeContext } from '../runtime'

type SceneInfo = {
  onScene: string,
  offScene: string,
  scenes: string[],
}
export type RoomMetaNode = Node & {
  type: 'roomMeta'
  key: string,
} & SceneInfo

type SceneInfoArg ={
    onScene: string,
    offScene?: string,
    scenes?: string[],
}

export class RoomMeta<Msg> extends Device<RoomMetaNode, Msg> {
  static make(key: string, sceneInfo: SceneInfoArg): RoomMetaNode {
    return {
      type: 'roomMeta',
      key,
      offScene: 'off',
      scenes: [],
      ...sceneInfo
    }
  }

//   async add({ mqttClient }: RuntimeContext<Msg>, meta: RoomMetaNode) {
//   }

//   async update(
//     {}: RuntimeContext<Msg>,
//     light: RoomMetaNode,
//     prevLight: ZSceneNode,
//   ) {
//     console.log('zScene update', light)
//     mqttClient.publish(`zigbee2mqtt/${light.topic}/set`, JSON.stringify({ scene_recall: light.sceneID }))
//   }
}

