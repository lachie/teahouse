import * as mqtt from 'async-mqtt'
import EventEmitter from 'events'
import { Command, CmdNone, run } from './commands'
import { Devices } from './devices'
import { childrenToRecord, Node, AnyNode, Container, Empty } from './house'
import { ScheduleManager } from './scheduleManager'
import {
  CoreSubscriptionManager,
  SubscriptionManager,
} from './mqttSubscriptionManager'
import { Sub, SubscriptionsManager } from './subscriptions'
import { WriteApi as InfluxWriteApi } from '@influxdata/influxdb-client'

import * as t from 'io-ts'
import { failure } from 'io-ts/PathReporter'
import { pipe } from 'fp-ts/function'
import { getOrElse } from 'fp-ts/Either'
import { Json } from 'fp-ts/Json'

export class RuntimeContext<Msg> {
  constructor(
    readonly key: string[],
    readonly mqttClient: mqtt.AsyncClient,
    readonly influxClient: InfluxWriteApi,
    readonly subMgr: SubscriptionManager,
    readonly schedMgr: ScheduleManager<Msg>,
    public dispatchMessage: (m: Msg) => void = (m: Msg) => {},
  ) {}

  push(key: string): RuntimeContext<Msg> {
    return new RuntimeContext(
      this.key.concat(key),
      this.mqttClient,
      this.influxClient,
      this.subMgr.push(key),
      this.schedMgr.push(key),
      this.dispatchMessage,
    )
  }

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

type DispatchAny = (m: any) => void
type GetAny = () => any
type Server = (d: DispatchAny, m: GetAny) => unknown
type Extras = {
  mqttClient: mqtt.AsyncClient
  influxClient: InfluxWriteApi
  inputServers: Server[]
}

export function runtime<Msg, Model>(
  spec: RuntimeSpec<Model, Msg>,
  { mqttClient, influxClient, inputServers: servers }: Extras,
) {
  const scheduleManager = new ScheduleManager<Msg>()

  const subscriptionManager = new CoreSubscriptionManager(
    mqttClient,
  ).subscriptionManager()

  const runtimeContext = new RuntimeContext<Msg>(
    [],
    mqttClient,
    influxClient,
    subscriptionManager,
    scheduleManager,
  )

  const rt = new Runtime({ ...spec, runtimeContext })

  const dispatchMessage = rt.dispatchMessage.bind(rt)
  const getModel = () => rt.model
  servers.forEach((s) => s(dispatchMessage, getModel))

  rt.run()
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

  constructor({
    update,
    subscriptions,
    house,
    initialModel,
    runtimeContext,
  }: RuntimeSpec<Model, Msg> & { runtimeContext: RuntimeContext<Msg> }) {
    this.update = update
    this.subscriptions = subscriptions
    this.house = house
    this.model = initialModel
    this.runtimeContext = runtimeContext
    this.bus = new EventEmitter()
    this.devices = new Devices()

    // this.bus.on('dispatchMessage', this.dispatchMessage.bind(this))
    this.runtimeContext.setDispatchMessage(this.dispatchMessage.bind(this))
    this.subscriptionsManager = new SubscriptionsManager(
      this.dispatchMessage.bind(this),
    )
  }

  run() {
    console.log('initial model', this.model)
    this.subscriptionsManager.updateSubs(this.subscriptions(this.model))

    const nextHouse = this.house(this.model)
    this.houseState = this.reifyNode(this.runtimeContext, nextHouse, Empty)
  }

  dispatchMessage(msg: Msg) {
    const [nextModel, cmd] = this.update(this.model, msg)
    this.model = nextModel
    console.log('model after update', this.model)
    this.subscriptionsManager.updateSubs(this.subscriptions(nextModel))

    // TODO handle cmds

    let nextHouse = this.house(nextModel)
    this.houseState = this.reifyNode(
      this.runtimeContext,
      nextHouse,
      this.houseState,
    )
  }

  reifyNode<Msg>(
    ctx: RuntimeContext<Msg>,
    node: Container<Msg>,
    prevNode: Container<Msg>,
  ): Container<Msg> {
    const prevChildren = childrenToRecord(prevNode)
    const children = childrenToRecord(node)

    for (const key in children) {
      const node = children[key]
      const prevNode = prevChildren[key]

      if (prevNode) {
        this.updateNode(ctx, node, prevNode)
        delete prevChildren[key]
      } else {
        this.addNode(ctx, node)
      }
    }

    for (const roomId in prevChildren) {
      this.removeNode(ctx, prevChildren[roomId])
    }

    return node
  }

  updateNode<Msg>(
    ctx: RuntimeContext<Msg>,
    node: AnyNode<Msg>,
    prevNode: AnyNode<Msg>,
  ) {
    if (hasChildren(node)) {
      this.reifyNode(ctx.push(node.key), node, prevNode)
    } else {
      this.devices.update(ctx, node, prevNode)
    }
  }
  addNode<Msg>(ctx: RuntimeContext<Msg>, node: AnyNode<Msg>) {
    if (hasChildren(node)) {
      this.reifyNode(ctx.push(node.key), node, Empty)
    } else {
      this.devices.add(ctx, node)
    }
  }
  removeNode<Msg>(ctx: RuntimeContext<Msg>, node: AnyNode<Msg>) {
    if (hasChildren(node)) {
      this.reifyNode(ctx.push(node.key), Empty, node)
    } else {
      this.devices.remove(ctx, node)
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
