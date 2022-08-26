import { AsyncClient } from 'async-mqtt'
import { Device } from './device'
import { Node } from '../house'
import { RuntimeContext } from '../runtime'
import { ZDevice } from './zDevice'
import { normalise, sawNorm, sineNorm } from '../util/scale'

const warmTemp = 454
const coolTemp = 250
const cosyTemp = warmTemp
const noonTemp = coolTemp * 1.2

type LightRange = 'cosy' | 'work'

type ZLightDefinition = {
    warmest: number,
    coolest: number,
    ranges: Record<LightRange, [number,number]> // [warm,cool]
}

export type LightKind = 'ikea' | 'ikea-spot'
const lightDefs: Record<LightKind,ZLightDefinition> = {
  'ikea': {
    warmest: 454,
    coolest: 250,
    ranges: {
      cosy: [1,1],
      work: [0.5,1],
    }
  },
  'ikea-spot': {
    warmest: 454,
    coolest: 250,
    ranges: {
      cosy: [0.85,1],
      work: [0.5,1],
    }
  }
}


type ZColour = {
    r: number, g: number, b: number
}
// 250 and 454
type ZColourTemp = number

export type ZLightPayload = {
  state: string
  brightness: number
  color: ZColour 
  color_temp: ZColourTemp
  white: [number,number,LightRange]
}
export type PartialPayload = Partial<ZLightPayload>

export type ZLightNode = Node & {
  type: 'zLight'
  kind: LightKind
  key: string
  topic: string
  payload: PartialPayload
}

export class ZLight<Msg> extends ZDevice<Msg, PartialPayload, ZLightNode> {
  static make(key: string, kind: LightKind, topic: string, payload: PartialPayload): ZLightNode {
    return {
      type: 'zLight',
      key,
      topic,
      kind,
      payload
    }
  }

  parsePayload({payload, kind}: ZLightNode): Record<string,unknown> {
    const def = lightDefs[kind]
    let p = {}
    if (payload.white !== undefined) {
      const [brightness, prog, rangeName] = payload.white
      const [warmScale,coolScale] = def.ranges[rangeName]

      // const tempScale = sineNorm(def.cosy, def.noon)
      const tempScale = sawNorm(def.warmest * warmScale, def.coolest * coolScale)

      console.log(kind, "temp", prog, tempScale(prog), tempScale(0), tempScale(0.5), tempScale(1.0))

      p = {
        state: 'ON',
        brightness: 254 * brightness,
        color_temp: tempScale(prog),
        color: { r: 0, g: 0, b: 0 },
      }
    } else {
      p = { ...payload }
    }

    return p
  }

  publish({ mqttClient }: RuntimeContext<Msg>, device: ZLightNode): void {
    mqttClient.publish(`zigbee2mqtt/${device.topic}/set`, JSON.stringify(this.parsePayload(device)))
  }
}
