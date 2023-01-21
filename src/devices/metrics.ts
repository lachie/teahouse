import { Point, WriteApi } from '@influxdata/influxdb-client'
import { Node } from '../house'
import { Device } from './device'

type Field = [string, number | string | boolean]

export type MetricsNode = Node & {
  type: 'metrics'
  tags: Record<string, string>
  fields: Field[]
}

type RuntimeContext = {
  influxClient: WriteApi
}

export class Metrics<Msg> extends Device<MetricsNode, Msg> {
  static make<Msg>(
    key: string,
    tags: Record<string, string> = {},
    ...fields: Field[]
  ): MetricsNode {
    return { type: 'metrics', key, tags, fields }
  }

  async update(
    { influxClient }: RuntimeContext,
    metrics: MetricsNode,
    prevMetrics: MetricsNode,
  ) {
    console.log('metrics', metrics.key)
    console.log(metrics.fields)
    const pointReducer = (p: Point, [k, v]: Field): Point => {
      switch (typeof v) {
        case 'number':
          return p.intField(k, v)
        case 'boolean':
          return p.booleanField(k, v)
        default:
          return p.stringField(k, v.toString())
      }
    }
    const point = metrics.fields.reduce(pointReducer, new Point(metrics.key))
    for (const k in metrics.tags) {
      point.tag(k, metrics.tags[k])
    }

    console.log('metrics point:', point)
    influxClient.writePoint(point)

    // console.log('rfLight upate', light)
    // mqttClient.publish(light.topic, light.on ? '1' : '0')

    influxClient.flush()
  }
}
