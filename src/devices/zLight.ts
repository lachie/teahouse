import { AsyncClient } from 'async-mqtt'
import { Device } from './device'
import { Node } from '../house'
import { RuntimeContext } from '../runtime'
import { PublishingDevice } from './pubDevice'
import { normalise, sawNorm, sineNorm } from '../util/scale'

const warmTemp = 454
const coolTemp = 250
const cosyTemp = warmTemp
const noonTemp = coolTemp * 1.2

type LightRange = 'cosy' | 'work'

type ZLightDefinition = {
  warmest: number
  coolest: number
  ranges: Record<LightRange, [number, number]> // [warm,cool]
}

export type LightKind = 'ikea' | 'ikea-spot'
const lightDefs: Record<LightKind, ZLightDefinition> = {
  ikea: {
    warmest: 454,
    coolest: 250,
    ranges: {
      cosy: [1, 1],
      work: [0.5, 1],
    },
  },
  'ikea-spot': {
    warmest: 454,
    coolest: 250,
    ranges: {
      cosy: [0.85, 1],
      work: [0.5, 1],
    },
  },
}

type ZColour = {
  r: number
  g: number
  b: number
}
// 250 and 454
type ZColourTemp = number
type WhiteSpec = {
  brightness: number
  progress: number
  range: LightRange
}

export type ZLightPayload = {
  state: string
  brightness: number
  color: ZColour
  color_temp: ZColourTemp
  white: WhiteSpec
}
export type PartialPayload = Partial<ZLightPayload>

export const white =
  (base: Partial<WhiteSpec>) => (brightness = 1.0) => (progress: number): PartialPayload =>
  ({
    white: {
      range: 'cosy',
      brightness,
      progress,
      ...base,
    },
  })

export const cosy = white({ range: 'cosy' })
export const work = white({ range: 'work' })
export const off = () => ({ state: 'OFF' })

export const colour =
  (color: ZColour, base: PartialPayload = {}) =>
    (override: PartialPayload = {}): PartialPayload => ({
      state: 'ON',
      brightness: 255,
      color,
      ...base,
      ...override,
    })

export const doorbell = colour({ r: 255, g: 0, b: 0 })

export type ZLightNode = Node & {
  type: 'zLight'
  kind: LightKind
  key: string
  topic: string
  payload: PartialPayload
}

export class ZLight<Msg> extends PublishingDevice<
  Msg,
  PartialPayload,
  ZLightNode
> {
  static make(
    key: string,
    kind: LightKind,
    topic: string,
    payload: PartialPayload,
  ): ZLightNode {
    return {
      type: 'zLight',
      key,
      topic,
      kind,
      payload,
    }
  }

  parsePayload({ payload, kind }: ZLightNode): Record<string, unknown> {
    const def = lightDefs[kind]
    let p = {}
    if (payload.white !== undefined) {
      const { brightness, progress, range } = payload.white
      const [warmScale, coolScale] = def.ranges[range]

      // const tempScale = sineNorm(def.cosy, def.noon)
      const tempScale = sawNorm(
        def.warmest * warmScale,
        def.coolest * coolScale,
      )

      console.log(
        kind,
        'temp',
        progress,
        tempScale(progress),
        tempScale(0),
        tempScale(0.5),
        tempScale(1.0),
      )

      p = {
        state: 'ON',
        brightness: 254 * brightness,
        color_temp: tempScale(progress),
        color: { r: 0, g: 0, b: 0 },
      }
    } else {
      p = { ...payload }
    }

    return p
  }

  publish({ mqttClient }: RuntimeContext<Msg>, device: ZLightNode): void {
    mqttClient.publish(
      `zigbee2mqtt/${device.topic}/set`,
      JSON.stringify(this.parsePayload(device)),
    )
  }
}
