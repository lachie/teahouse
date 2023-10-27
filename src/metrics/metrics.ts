import {
    WriteApi as InfluxWriteApi, Point,
} from '@influxdata/influxdb-client'

type Field = number | string | boolean
export interface IMetrics {
    push(key: string): IMetrics
    record(metrics: Record<string, Field>): void | Promise<void>
}

const pointReducer = (p: Point, [k, v]: [string, Field]): Point => {
    switch (typeof v) {
        case 'number':
            return p.intField(k, v)
        case 'boolean':
            return p.booleanField(k, v)
        default:
            return p.stringField(k, v.toString())
    }
}

export class InfluxMetrics implements IMetrics {
    constructor(readonly influxClient: InfluxWriteApi, readonly key: string[]) { }

    push(key: string): InfluxMetrics {
        return new InfluxMetrics(this.influxClient, this.key.concat(key))
    }

    get metricsKey(): string {
        return this.key.join('.')
    }

    record(metrics: Record<string, Field>) {
        const point = Object.entries(metrics).reduce(pointReducer, new Point(this.metricsKey))
        this.influxClient.writePoint(point)
        this.influxClient.flush()
    }
}