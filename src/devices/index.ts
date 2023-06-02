import { Device } from './device'
import { PersonDetector, PersonDetectorNode } from './personDetector'
import { RFLight, RFLightNode } from './rfLight'
import { Node } from '../house'
import { Metrics, MetricsNode } from './metrics'
import { ZLight, ZLightNode } from './zLight'
import { DeskCtl, DeskNode } from './deskctl'
import { ZButton, ZButtonNode } from './zButton'
import { ZScene, ZSceneNode } from './zScene'
import { MqttSensor, MqttSensorNode } from './mqttSensor'
import { Person, PersonNode } from './person'
import { Mqtt } from '../effects/mqtt'
import { TelegramMessage, TelegramMessageNode } from './telegramBot'
import { Secrets } from '../runtime'
import { RoomMeta, RoomMetaNode } from './roomMeta'
import { ShellyDimmer, ShellyDimmerNode } from './shellyDimmer'

export { RFLight, PersonDetector, Metrics, ZLight, ZScene }

type DeviceNode<Msg> =
  | RFLightNode
  | ZLightNode
  | ShellyDimmerNode
  | PersonDetectorNode<Msg>
  | MetricsNode
  | ZButtonNode<Msg>
  | ZSceneNode
  | MqttSensorNode<Msg>
  | TelegramMessageNode
  | PersonNode<Msg>
  | DeskNode
  | RoomMetaNode
type DeviceType<Msg> = DeviceNode<Msg>['type']
type DeviceList<Msg> = Record<DeviceType<Msg>, Device<DeviceNode<Msg>, Msg>>
// [k: string]: Device<DeviceNode<Msg>, Msg>
// }

export class Devices<Msg> extends Device<DeviceNode<Msg>, Msg> {
  devices: DeviceList<Msg>
  constructor(secrets: Secrets) {
    super()
    this.devices = {
      personDetector: new PersonDetector<Msg>(),
      person: new Person<Msg>(secrets),
      rfLight: new RFLight(),
      zLight: new ZLight(),
      shellyDimmer: new ShellyDimmer(),
      zButton: new ZButton(),
      zScene: new ZScene(),
      metrics: new Metrics(),
      mqttSensor: new MqttSensor(),
      telegramMessage: new TelegramMessage(),
      deskctl: new DeskCtl<Msg>(),
      roomMeta: new RoomMeta<Msg>(),
    }
  }
  choose(d: Node): Device<DeviceNode<Msg>, Msg> {
    const dev = this.devices[d.type as DeviceType<Msg>]
    if (dev) return dev
    throw new Error(`unknown device ${d.type}`)
  }
  isDevice(d: Node): d is DeviceNode<Msg> {
    return Object.keys(this.devices).includes(d.type)
  }
  async update(context: any, device: Node, prevDevice: Node) {
    if (!this.isDevice(prevDevice) || !this.isDevice(device)) return
    await this.choose(device).update(context, device, prevDevice)
  }
  async add(context: any, device: Node) {
    if (!this.isDevice(device)) return
    await this.choose(device).add(context, device)
  }
  async remove(context: any, device: Node) {
    if (!this.isDevice(device)) return
    await this.choose(device).remove(context, device)
  }
}
