import { Command } from './commands'
import { Devices } from './devices'
import { childrenToRecord, AnyNode, Container, Empty } from './house'
import { ScheduleManager } from './runtime/scheduleManager'
import {
  CoreSubscriptionManager,
  SubscriptionManager,
} from './runtime/mqttSubscriptionManager'
import { Sub, SubscriptionsManager } from './runtime/subscriptions'

import * as mqtt from 'async-mqtt'
import EventEmitter from 'events'
import {
  consoleLogger,
  WriteApi as InfluxWriteApi,
} from '@influxdata/influxdb-client'
import immutable from 'object-path-immutable'
import equal from 'deep-equal'
import { InterfaceFactory } from './interfaces'
import * as fs from 'node:fs';

export type Secrets = Record<string,Record<string,string>>

export class RuntimeContext<Msg> {
  constructor(
    readonly key: string[],
    readonly mqttClient: mqtt.AsyncClient,
    readonly influxClient: InfluxWriteApi,
    readonly subMgr: SubscriptionManager,
    readonly schedMgr: ScheduleManager<Msg>,
    readonly secrets: Secrets,
    public dispatchMessage: (m: Msg) => void = (m: Msg) => {},
  ) {}

  push(key: string): RuntimeContext<Msg> {
    return new RuntimeContext(
      this.key.concat(key),
      this.mqttClient,
      this.influxClient,
      this.subMgr.push(key),
      this.schedMgr.push(key),
      this.secrets,
      this.dispatchMessage,
    )
  }

  // allow dispatchMessage to be bound after instantiation
  setDispatchMessage(f: (m: Msg) => void) {
    this.dispatchMessage = f
    this.schedMgr.dispatchMessage = f
  }
}

type RuntimeSpec<Model, Msg> = {
  update: (model: Model, msg: Msg) => [Model, Command<Msg>]
  subscriptions: (model: Model) => Sub<Msg>
  initialModel: Model
  house: (m: Model) => Container<Msg>
}

type Extras<Msg, Model> = {
  mqttClient: mqtt.AsyncClient
  influxClient: InfluxWriteApi
  interfaces: InterfaceFactory<Msg, Model>[],
  logPath: string
  secrets: Secrets
}

// the main entrypoint for user's house scripts
export async function runtime<Msg, Model>(
  spec: RuntimeSpec<Model, Msg>,
  extras: Extras<Msg, Model>,
  initialMsg?: Msg
) {
  const scheduleManager = new ScheduleManager<Msg>()
  const { mqttClient, influxClient } = extras

  const subscriptionManager = new CoreSubscriptionManager(
    mqttClient,
  ).subscriptionManager()

  const runtimeContext = new RuntimeContext<Msg>(
    [],
    mqttClient,
    influxClient,
    subscriptionManager,
    scheduleManager,
    extras.secrets,
  )

  const rt = new Runtime({ ...spec, runtimeContext, extras })

  await rt.run(initialMsg)
}



export class Runtime<Model, Msg> {
  update: (model: Model, msg: Msg) => [Model, Command<Msg>]
  subscriptions: (model: Model) => Sub<Msg>
  model: Model
  house: (m: Model) => Container<Msg>
  houseState: Container<Msg> = Empty
  bus: EventEmitter
  devices: Devices<Msg>
  runtimeContext: RuntimeContext<Msg>
  subscriptionsManager: SubscriptionsManager<Msg>
  logStream: fs.WriteStream

  constructor({
    update,
    subscriptions,
    house,
    initialModel,
    runtimeContext,
    extras: { interfaces, logPath, secrets },
  }: RuntimeSpec<Model, Msg> & { runtimeContext: RuntimeContext<Msg> } & {
    extras: Extras<Msg, Model>
  }) {
    this.update = update
    this.subscriptions = subscriptions
    this.house = house
    this.model = initialModel
    this.runtimeContext = runtimeContext
    this.bus = new EventEmitter()
    this.devices = new Devices(secrets)

    // this.bus.on('dispatchMessage', this.dispatchMessage.bind(this))
    this.runtimeContext.setDispatchMessage(this.dispatchMessage.bind(this))
    this.subscriptionsManager = new SubscriptionsManager(
      this.dispatchMessage.bind(this),
    )

    const dispatchMessage = this.dispatchMessage.bind(this)
    const getModel = () => this.model
    const getHouseState = () => this.houseState

    const subscribeToModelChanged = (listener: (m: Model) => void) => {
      console.log('subscribing to model change')
      this.bus.on('modelChanged', listener)
    }
    const unsubscribeFromModelChanged = (listener: (m: Model) => void) => {
      this.bus.off('modelChanged', listener)
    }

    console.log('adding interfaces')
    interfaces.forEach((s) => {
      s.bindDispatchMessage(dispatchMessage)
      s.bindGetModel(getModel)
      s.bindGetHouseState(getHouseState)
      s.bindModelChange(subscribeToModelChanged, unsubscribeFromModelChanged)
      s.build()
    })

    // TODO roll log
    this.logStream = fs.createWriteStream(logPath, {flags: 'a', encoding: 'utf8', autoClose: true})
  }

  log(msg: string, payload: unknown, ts = new Date) {
    this.logStream.write(JSON.stringify({msg, ts, payload}))
    this.logStream.write('\n')
  }

  // kick off the runtime
  async run(initialMsg?: Msg) {
    if(initialMsg !== undefined) {
      this.log('initialMsg', initialMsg)
      this.log('initialModel', this.model)
      const [nextModel, cmd] = this.update(this.model, initialMsg)
      this.log('model', nextModel)
      this.model = nextModel
    }

    console.log('initial model', this.model)
    this.bus.emit('modelChanged', this.model)
    this.subscriptionsManager.updateSubs(this.subscriptions(this.model))

    const nextHouse = this.house(this.model)
    console.log("run - next house")
    console.dir(nextHouse, {depth: null})
    this.log('firstHouse', nextHouse)
    this.houseState = await this.reifyNodeSafe(this.runtimeContext, nextHouse, Empty)
    this.log('firstHouseState', this.houseState)
  }

  // inject a message into the runtime
  async dispatchMessage(msg: Msg) {
    this.log('dm.msg', msg)
    const [nextModel, cmd] = this.update(this.model, msg)
    console.log('dispatchMessage: ', msg)
    if (equal(this.model, nextModel)) {
      console.log('no change to model, no effect')
      return
    }
    this.log('dm.model', nextModel)
    this.model = nextModel
    console.log('model after update', this.model)
    this.bus.emit('modelChanged', this.model)

    this.subscriptionsManager.updateSubs(this.subscriptions(nextModel))

    // TODO handle cmds

    let nextHouse = this.house(nextModel)
    this.log('dm.house', nextHouse)
    this.houseState = await this.reifyNodeSafe(
      this.runtimeContext,
      nextHouse,
      this.houseState,
    )
    this.log('dm.houseState', this.houseState)
  }

  async reifyNodeSafe<Msg>(
    ctx: RuntimeContext<Msg>,
    node: Container<Msg>,
    prevNode: Container<Msg>,
  ): Promise<Container<Msg>> {
    try {
      return this.reifyNode(ctx, node, prevNode)
    } catch(e) {
      console.log(`node reify failed: ${e}`)
    }
    return prevNode
  }

  // takes a node tree and applies side effects
  async reifyNode<Msg>(
    ctx: RuntimeContext<Msg>,
    node: Container<Msg>,
    prevNode: Container<Msg>,
  ): Promise<Container<Msg>> {
    const prevChildren = childrenToRecord(prevNode)
    const children = childrenToRecord(node)

    for (const key in children) {
      const node = children[key]
      const prevNode = prevChildren[key]

      if (prevNode) {
        await this.updateNode(ctx, node, prevNode)
        delete prevChildren[key]
      } else {
        await this.addNode(ctx, node)
      }
    }

    for (const roomId in prevChildren) {
      await this.removeNode(ctx, prevChildren[roomId])
    }

    return node
  }

  async updateNode<Msg>(
    ctx: RuntimeContext<Msg>,
    node: AnyNode<Msg>,
    prevNode: AnyNode<Msg>,
  ) {
    if (hasChildren(node)) {
      await this.reifyNode(ctx.push(node.key), node, prevNode)
    } else {
      await this.devices.update(ctx, node, prevNode)
    }
  }
  async addNode<Msg>(ctx: RuntimeContext<Msg>, node: AnyNode<Msg>) {
    if (hasChildren(node)) {
      await this.reifyNode(ctx.push(node.key), node, Empty)
    } else {
      await this.devices.add(ctx, node)
    }
  }
  async removeNode<Msg>(ctx: RuntimeContext<Msg>, node: AnyNode<Msg>) {
    if (hasChildren(node)) {
      await this.reifyNode(ctx.push(node.key), Empty, node)
    } else {
      await this.devices.remove(ctx, node)
    }
  }
}

function hasChildren<Msg>(node: AnyNode<Msg>): boolean {
  return (
    'children' in node &&
    node.children !== undefined &&
    node.children.length > 0
  )
}
