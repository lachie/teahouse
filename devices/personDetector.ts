import { Device } from './device'
import { Node } from '../house'
import { RuntimeContext } from '../runtime'

export type PersonDetectorNode<Msg> = Node & {
  type: 'personDetector'
  key: string
  topic: string
  offDelay: number
  onChange: (b: boolean) => Msg
}

const defaultOffDelay = 10 * 1000

export class PersonDetector<Msg> extends Device<PersonDetectorNode<Msg>, Msg> {
  static make<Msg>(
    key: string,
    topic: string,
    onChange: (b: boolean) => Msg,
    offDelay = defaultOffDelay,
  ): PersonDetectorNode<Msg> {
    return {
      type: 'personDetector',
      key,
      topic,
      onChange,
      offDelay,
    }
  }

  add(
    { subMgr, dispatchMessage, schedMgr }: RuntimeContext<Msg>,
    p: PersonDetectorNode<Msg>,
  ) {
    subMgr.subscribe(p.key, p.topic, ({ message }: { message: string }) => {
      console.log(
        'personDetector received',
        message === '1' ? 'occupied' : 'not occupied',
      )
      const occupied = message === '1'
      const msg = p.onChange(occupied)

      if (occupied) {
        dispatchMessage(msg)
      } else {
        schedMgr.dispatchAfter(p.key, p.offDelay, msg)
      }
    })
  }

  remove({ subMgr }: RuntimeContext<Msg>, p: PersonDetectorNode<Msg>) {
    subMgr.unsubscribe(p.key, p.topic)
  }
}
