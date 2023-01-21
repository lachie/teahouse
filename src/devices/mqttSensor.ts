import { Device } from './device'
import { Node } from '../house'
import { RuntimeContext } from '../runtime'

export type MqttSensorNode<Msg> = Node & {
  type: 'mqttSensor'
  key: string
  topic: string
  tagger: (payload: Record<string,unknown>) => Msg
}

const defaultOffDelay = 10 * 1000

export class MqttSensor<Msg> extends Device<MqttSensorNode<Msg>, Msg> {
  static make<Msg>(
    key: string,
    topic: string,
    tagger: (action: Record<string,unknown>) => Msg,
  ): MqttSensorNode<Msg> {
    return {
      type: 'mqttSensor',
      key,
      topic,
      tagger,
    }
  }

  async add({ subMgr, schedMgr, mqttClient }: RuntimeContext<Msg>, p: MqttSensorNode<Msg>) {
    console.log('MqttSensor add', p.key, p.topic)
    subMgr.subscribe(
      p.key,
     p.topic,
      ({ message }: { message: string }) => {
        console.log('MqttSensor msg', p.topic, message)
        const payload = JSON.parse(message)

        if (payload !== undefined) {
          const msg = p.tagger(payload)

          schedMgr.dispatchMessage(msg)
        }
      },
    )
    // mqttClient.publish(`${p.topic}/get`)
  }

  async remove({ subMgr }: RuntimeContext<Msg>, p: MqttSensorNode<Msg>) {
    console.log('MqttSensor remove', p.key, p.topic)
    subMgr.unsubscribe(p.key, p.topic)
  }
}