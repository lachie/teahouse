import { RuntimeContext } from '../runtime'
import { Node } from '../house'

export class Device<D extends Node, Msg> {
  async update(context: RuntimeContext<Msg>, device: D, prevDevice: D) {}
  async add(context: RuntimeContext<Msg>, device: D) {}
  async remove(context: RuntimeContext<Msg>, device: D) {}
}
