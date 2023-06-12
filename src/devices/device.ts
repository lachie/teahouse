import { RuntimeContext } from '../runtime'
import { Node } from '../house'

/**
 * A device is a component that can be added to a house.
 * It is represented as a leaf node in the house tree.
 * 
 * Based on changes to the house tree, devices are added, removed, or updated.
 * 
 * Each device implements update, add, and remove methods to apply side effects (or to configure
 * the environment for ongoing side effects to be applied in the background).
 * 
 * Note that Device sub-classes need to be registered in the Devices helper class.
 */
export class Device<D extends Node, Msg> {
  async update(context: RuntimeContext<Msg>, device: D, prevDevice: D) { }
  async add(context: RuntimeContext<Msg>, device: D) { }
  async remove(context: RuntimeContext<Msg>, device: D) { }
}
