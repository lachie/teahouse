import { RuntimeContext } from '../runtime'
import { Node } from '../house'

export class Device<D extends Node, Msg> {
  update(context: RuntimeContext<Msg>, device: D, prevDevice: D) {}
  add(context: RuntimeContext<Msg>, device: D) {}
  remove(context: RuntimeContext<Msg>, device: D) {}
}
