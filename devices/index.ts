import { Device } from './device'
import { PersonDetector, PersonDetectorNode } from './personDetector'
import { RFLight, RFLightNode } from './rfLight'
import { Node } from '../house'
import { Metrics, MetricsNode } from './metrics'

export { RFLight, PersonDetector, Metrics }

type DeviceNode<Msg> = RFLightNode | PersonDetectorNode<Msg> | MetricsNode
type DeviceList<Msg> = {
  [k: string]: Device<DeviceNode<Msg>, Msg>
}

export class Devices<Msg> extends Device<DeviceNode<Msg>, Msg> {
  devices: DeviceList<Msg>
  constructor() {
    super()
    this.devices = {
      personDetector: new PersonDetector<Msg>(),
      rfLight: new RFLight(),
      metrics: new Metrics(),
    }
  }
  choose(d: Node): Device<DeviceNode<Msg>, Msg> {
    return this.devices[d.type] || this.devices['default']
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
