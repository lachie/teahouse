import { Device } from './device'
import { Node } from '../house'
import { RuntimeContext } from '../runtime'

export type PersonDetectorNode<Msg> = Node & {
  type: 'personDetector'
  key: string
  topic: string
  offDelay: number
  onChange: (b: boolean) => Msg
  onRawChange?: (b: boolean) => Msg
}

const defaultOffDelay = 10 * 1000

export class PersonDetector<Msg> extends Device<PersonDetectorNode<Msg>, Msg> {
  static make<Msg>(
    key: string,
    topic: string,
    onChange: (b: boolean) => Msg,
    offDelay = defaultOffDelay,
    onRawChange?: (b: boolean) => Msg,
  ): PersonDetectorNode<Msg> {
    return {
      type: 'personDetector',
      key,
      topic,
      onChange,
      offDelay,
      onRawChange,
    }
  }

  add({ subMgr, schedMgr }: RuntimeContext<Msg>, p: PersonDetectorNode<Msg>) {
    subMgr.subscribe(p.key, p.topic, ({ message }: { message: string }) => {
      const occupied = message === '1'
      const msg = p.onChange(occupied)

      if (p.onRawChange) {
        const sensorMsg = p.onRawChange(occupied)
        schedMgr.dispatchMessage(sensorMsg)
      }

      if (occupied) {
        console.log('personDetector, occupied=true dispatching now')
        schedMgr.dispatchNow(p.key, msg)
      } else {
        console.log(
          `personDetector, occupied=false dispatching after ${Math.floor(
            p.offDelay / 1000,
          )}s`,
        )
        schedMgr.dispatchAfter(p.key, p.offDelay, msg)
      }
    })
  }

  remove({ subMgr }: RuntimeContext<Msg>, p: PersonDetectorNode<Msg>) {
    subMgr.unsubscribe(p.key, p.topic)
  }
}
