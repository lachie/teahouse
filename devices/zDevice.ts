import { Device } from './device'
import { Node } from '../house'
import { RuntimeContext } from '../runtime'
import { isDeepStrictEqual } from 'node:util'

type ZNode<P>  = Node & {
    topic: string
    payload: P
}

export abstract class ZDevice<Msg, P, D extends ZNode<P>> extends Device<D, Msg> {
  abstract publish(
    ctx: RuntimeContext<Msg>,
    device: D
  ): void

  add(ctx: RuntimeContext<Msg>, device: D): void {
    this.publish(ctx, device)
  }

  update(ctx: RuntimeContext<Msg>, device: D, prevDevice: D) {
    if (!isDeepStrictEqual(device, prevDevice)) {
      this.publish(ctx, device)
    }
  }
}