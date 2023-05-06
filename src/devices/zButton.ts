import { Device } from './device'
import { Node } from '../house'
import { RuntimeContext } from '../runtime'

export type ZButtonNode<Msg> = Node & {
  type: 'zButton'
  key: string
  topic: string
  onChange: (button: string) => Msg
}

const defaultOffDelay = 10 * 1000

export class ZButton<Msg> extends Device<ZButtonNode<Msg>, Msg> {
  static make<Msg>(
    key: string,
    topic: string,
    onChange: (action: string) => Msg,
  ): ZButtonNode<Msg> {
    return {
      type: 'zButton',
      key,
      topic,
      onChange,
    }
  }

  async add({ subMgr, schedMgr }: RuntimeContext<Msg>, p: ZButtonNode<Msg>) {
    // console.log('add', p.key, p.topic)
    subMgr.subscribe(
      p.key,
      `zigbee2mqtt/${p.topic}`,
      ({ message }: { message: string }) => {
        // console.log("zButton", p.topic, message)
        const { action } = JSON.parse(message)

        if (action !== undefined) {
          const msg = p.onChange(action)

          schedMgr.dispatchMessage(msg)
        }
      },
    )
  }

  async remove({ subMgr }: RuntimeContext<Msg>, p: ZButtonNode<Msg>) {
    subMgr.unsubscribe(p.key, `zigbee2mqtt/${p.topic}`)
  }
}

