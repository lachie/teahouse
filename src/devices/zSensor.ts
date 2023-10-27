import { MqttSensor, MqttSensorNode } from './mqttSensor'


class ZSensor<Msg> extends MqttSensor<Msg> {
  static make<Msg>(
    key: string,
    topic: string,
    tagger: (action: Record<string, unknown>) => Msg,
    recordMetrics?: boolean,
  ): MqttSensorNode<Msg> {
    return MqttSensor.make(key, `zigbee2mqtt/${topic}`, tagger, recordMetrics)
  }
}

export type ZTempPayload = {
  temperature: number
  humidity: number
  pressure: number
}
export class ZTemp<Msg> extends ZSensor<Msg> {
}

export type ZPresencePayload = {
  occupancy: number
  illuminance_lux: number
  illuminance: number
}
export class ZPresence<Msg> extends ZSensor<Msg> {
}