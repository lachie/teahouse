import { AsyncClient } from 'async-mqtt'
import { string } from 'io-ts'
import Emittery from 'emittery'

type RawMessage = {
  topic: string
  message: string
}

type Handler = (msg: RawMessage) => void

export class CoreSubscriptionManager {
  bus: Emittery = new Emittery()
  handlers: Record<string, Handler> = {}
  offs: Record<string, any> = {}
  subs: Record<string, Set<string>> = {}

  constructor(readonly mqttClient: AsyncClient) {
    this.bus.on('sub', (a: [string, string]) => this.sub(a))
    this.bus.on('unsub', (a: [string, string]) => this.unsub(a))
    this.mqttClient.on('message', (topic, message) => {
      this.dispatchMessage({ topic, message: message.toString() })
    })
  }

  subscriptionManager() {
    return new SubscriptionManager([], this)
  }

  subscribe(key: string, topic: string, handler: (msg: RawMessage) => void) {
    this.bus.emit('sub', [topic, key])
    this.offs[[topic, key].join('.')] = this.bus.on(topic, handler)
  }

  unsubscribe(key: string, topic: string) {
    this.bus.emit('unsub', [topic, key])
    const off = this.offs[[topic, key].join('.')]
    if (off) off()
  }

  getSubs(topic: string): Set<string> {
    this.subs[topic] ||= new Set<string>()
    return this.subs[topic]
  }

  async sub([topic, key]: [string, string]) {
    this.getSubs(topic).add(key)
    await this.mqttClient.subscribe(topic)
  }
  async unsub([topic, key]: [string, string]) {
    this.getSubs(topic).delete(key)
    if (this.getSubs(topic).size == 0) {
      await this.mqttClient.unsubscribe(topic)
    }
  }

  dispatchMessage(msg: RawMessage) {
    this.bus.emit(msg.topic, msg)
  }
}

export class SubscriptionManager {
  constructor(
    readonly key: string[],
    readonly coreSubscriptionManager: CoreSubscriptionManager,
  ) {}

  push(key: string): SubscriptionManager {
    return new SubscriptionManager(
      this.key.concat(key),
      this.coreSubscriptionManager,
    )
  }

  subscribe(key: string, topic: string, handler: (msg: RawMessage) => void) {
    const fullKey = this.key.concat(key).join('.')
    this.coreSubscriptionManager.subscribe(fullKey, topic, handler)
  }

  unsubscribe(key: string, topic: string) {
    const fullKey = this.key.concat(key).join('.')
    this.coreSubscriptionManager.unsubscribe(fullKey, topic)
  }
}
