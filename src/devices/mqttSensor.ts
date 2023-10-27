import { Device } from './device'
import { Node } from '../house'
import { RuntimeContext } from '../runtime'

export type MqttSensorNode<Msg> = Node & {
  type: 'mqttSensor'
  key: string
  topic: string
  tagger?: (payload: Record<string, unknown>) => Msg
  recordMetrics?: boolean
}

const defaultOffDelay = 10 * 1000

export class MqttSensor<Msg> extends Device<MqttSensorNode<Msg>, Msg> {
  static make<Msg>(
    key: string,
    topic: string,
    tagger: (action: Record<string, unknown>) => Msg,
    recordMetrics?: boolean,
  ): MqttSensorNode<Msg> {
    return {
      type: 'mqttSensor',
      key,
      topic,
      tagger,
      recordMetrics,
    }
  }

  static makeMetrics<Msg>(
    key: string,
    topic: string,
  ): MqttSensorNode<Msg> {
    return {
      type: 'mqttSensor',
      key,
      topic,
      recordMetrics: true
    }
  }

  async add({ mqttSubMgr, schedMgr, metrics }: RuntimeContext<Msg>, p: MqttSensorNode<Msg>) {
    console.log('MqttSensor add', p.key, p.topic, p.recordMetrics ? 'metrics' : '')
    mqttSubMgr.subscribe(
      p.key,
      p.topic,
      ({ message }: { message: string }) => {
        console.log('MqttSensor msg', p.topic, message)
        const payload = JSON.parse(message)

        if (payload !== undefined) {
          if (p.tagger) {
            const msg = p.tagger(payload)
            schedMgr.dispatchMessage(msg)
          }
          if (p.recordMetrics) {
            metrics.record(payload)
          }
        }
      },
    )
    // mqttClient.publish(`${p.topic}/get`)
  }

  async remove({ mqttSubMgr }: RuntimeContext<Msg>, p: MqttSensorNode<Msg>) {
    console.log('MqttSensor remove', p.key, p.topic)
    mqttSubMgr.unsubscribe(p.key, p.topic)
  }
}