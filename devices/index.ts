import { Device } from './device'
import { PersonDetector, PersonDetectorNode } from './personDetector'
import { RFLight, RFLightNode } from './rfLight'
import { Node } from '../house'
import { Metrics, MetricsNode } from './metrics'
import { ZLight, ZLightNode } from './zLight'
import { ZButton, ZButtonNode } from './zButton'
import { ZScene, ZSceneNode } from './zScene'
import { MqttSensor, MqttSensorNode } from './mqttSensor'
import { Mqtt } from '../effects/mqtt'

export { RFLight, PersonDetector, Metrics, ZLight, ZScene }

type DeviceNode<Msg> = RFLightNode | ZLightNode | PersonDetectorNode<Msg> | MetricsNode | ZButtonNode<Msg> | ZSceneNode | MqttSensorNode<Msg>
type DeviceType<Msg> = DeviceNode<Msg>['type']
type DeviceList<Msg> = Record<DeviceType<Msg>, Device<DeviceNode<Msg>, Msg>>
  // [k: string]: Device<DeviceNode<Msg>, Msg>
// }

export class Devices<Msg> extends Device<DeviceNode<Msg>, Msg> {
  devices: DeviceList<Msg>
  constructor() {
    super()
    this.devices = {
      personDetector: new PersonDetector<Msg>(),
      rfLight: new RFLight(),
      zLight: new ZLight(),
      zButton: new ZButton(),
      zScene: new ZScene(),
      metrics: new Metrics(),
      mqttSensor: new MqttSensor()
    }
  }
  choose(d: Node): Device<DeviceNode<Msg>, Msg> {
    const dev = this.devices[d.type as DeviceType<Msg>]
    if(dev) return dev
    throw new Error(`unknown device ${d.type}`)
  }
  isDevice(d: Node): d is DeviceNode<Msg> {
    return Object.keys(this.devices).includes(d.type)
  }
  update(context: any, device: Node, prevDevice: Node) {
    if (!this.isDevice(prevDevice) || !this.isDevice(device)) return
    this.choose(device).update(context, device, prevDevice)
  }
  add(context: any, device: Node) {
    if (!this.isDevice(device)) return
    this.choose(device).add(context, device)
  }
  remove(context: any, device: Node) {
    if (!this.isDevice(device)) return
    this.choose(device).remove(context, device)
  }
}
