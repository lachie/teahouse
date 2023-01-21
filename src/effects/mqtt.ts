import Emittery from 'emittery'
import { MqttClient } from 'mqtt'
import { Updater } from './updater'

type Key = string
type Tagger<Msg> = (key: string, data: Record<string, unknown>) => Msg
type Taggers<Msg> = Record<Key, Tagger<Msg>[]>

export type Mqtt<Msg> = {
  type: 'mqtt'
  key: Key
  tagger: Tagger<Msg>
}
export const Mqtt = <Msg>(key: Key, tagger: Tagger<Msg>): Mqtt<Msg> => ({
  type: 'mqtt',
  key,
  tagger,
})

const key = <Msg>({ key }: Mqtt<Msg>): string => key

export class MqttEffect<Msg> {
  taggers: Taggers<Msg> = {}
  updater: Updater<Mqtt<Msg>>

  constructor(readonly mqtt: MqttClient, readonly sendToApp: (m: Msg) => void) {
    this.updater = new Updater(
      this.add.bind(this),
      this.remove.bind(this),
      this.subToString.bind(this),
    )
    this.mqtt.on('message', this.handleEvent.bind(this))
  }

  update(subs: Mqtt<Msg>[]): void {
    this.updater.update(subs)
  }

  subToString(s: Mqtt<Msg>): string {
    return s.key
  }

  async add(m: Mqtt<Msg>) {
    await this.mqtt.subscribe(m.key)
  }

  async remove(m: Mqtt<Msg>) {
    await this.mqtt.unsubscribe(m.key)
  }

  handleEvent(key: Key, event: Record<string, unknown>): void {
    const taggers = this.taggers[key]
    for (const tagger of taggers) {
      console.log('MqttEffect sendToApp', tagger(key, event))
      this.sendToApp(tagger(key, event))
    }
  }

  isSub(sub: { type: string }): sub is Mqtt<Msg> {
    return sub.type == 'mqtt'
  }
}
