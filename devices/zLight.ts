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

type ZLightDefinition = {
    warm: number,
    cool: number,
    cosy: number
    noon: number
}

const lightDefs: Record<string,ZLightDefinition> = {
  'ikea': {
    warm: 250,
    cool: 454,
    cosy: cosyTemp,
    noon: noonTemp
  }
}

export type LightKind = keyof typeof lightDefs

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
  white: [number,number]
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
      const [brightness, prog] = payload.white
      // const tempScale = sineNorm(def.cosy, def.noon)
      const tempScale = sawNorm(def.cosy, def.noon)
      console.log("brightness", brightness, "prog", prog)
      console.log("def", def)
      console.log("scaled", tempScale(prog))
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
