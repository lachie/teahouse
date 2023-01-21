import { AsyncClient } from "async-mqtt"

export type SendMessage = {
    type: 'send-message',
    topic: string,
    body: string
}

export async function run({ mqttClient }: {mqttClient: AsyncClient}, _model: unknown, msg: SendMessage) {
  console.log('... command: sendMessage', msg)
  return mqttClient.publish(msg.topic, msg.body)
}