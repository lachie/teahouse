import { Command } from './commands'
import { Devices } from './devices'
import { childrenToRecord, AnyNode, Container, Empty } from './house'
import { ScheduleManager } from './runtime/scheduleManager'
import {
  RootMqttSubscriptionManager,
  MqttSubscriptionManager,
} from './runtime/mqttSubscriptionManager'
import { Sub, SubscriptionsManager } from './runtime/subscriptions'

import * as mqtt from 'async-mqtt'
import EventEmitter from 'events'
import {
  WriteApi as InfluxWriteApi,
} from '@influxdata/influxdb-client'
import { IMetrics } from './metrics/metrics'
import equal from 'deep-equal'
import { InterfaceFactory } from './interfaces'
import * as stream from 'node:stream'

export type Secrets = Record<string, Record<string, string>>

/**
 * RuntimeContext is a container for all the runtime dependencies, scoped to a node.
 * 
 * RuntimeContext is scoped by pushing a node's key and returning a new scoped copy of RuntimeContext.
 */
export class RuntimeContext<Msg> {
  constructor(
    readonly key: string[],
    readonly mqttClient: mqtt.AsyncClient,
    readonly influxClient: InfluxWriteApi,
    readonly metrics: IMetrics,
    readonly mqttSubMgr: MqttSubscriptionManager,
    readonly schedMgr: ScheduleManager<Msg>,
    readonly secrets: Secrets,
    readonly devices: Devices<Msg>,
    public dispatchMessage: (m: Msg) => void = () => { },
  ) { }

  push(key: string): RuntimeContext<Msg> {
    return new RuntimeContext(
      this.key.concat(key),
      this.mqttClient,
      this.influxClient,
      this.metrics.push(key),
      this.mqttSubMgr.push(key),
      this.schedMgr.push(key),
      this.secrets,
      this.devices,
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
  metrics: IMetrics,
  interfaces: InterfaceFactory<Msg, Model>[]
  logPath: string
  secrets: Secrets
}

/**
 * The main entrypoint for user's house scripts.
 */
export async function runtime<Msg, Model>(
  spec: RuntimeSpec<Model, Msg>,
  extras: Extras<Msg, Model>,
  initialMsg?: Msg,
) {
  const scheduleManager = new ScheduleManager<Msg>()

  const mqttSubscriptionManager = new RootMqttSubscriptionManager(
    extras.mqttClient,
  ).subscriptionManager()

  const devices = new Devices<Msg>(extras.secrets)

  // The root runtime context.
  const runtimeContext = new RuntimeContext<Msg>(
    [],
    extras.mqttClient,
    extras.influxClient,
    extras.metrics,
    mqttSubscriptionManager,
    scheduleManager,
    extras.secrets,
    devices,
  )

  const rt = new Runtime({ ...spec, runtimeContext, extras })

  await rt.run(initialMsg)
}

/**
 * The runtime is the main loop of the house.
 * 
 * In essence it is a state machine that 
 * - takes a message and updates the model.
 * - takes the model and produces (reifies) a new house.
 * - takes the new house and applies side effects.
 */
export class Runtime<Model, Msg> {
  update: (model: Model, msg: Msg) => [Model, Command<Msg>]
  subscriptions: (model: Model) => Sub<Msg>
  model: Model
  house: (m: Model) => Container<Msg>
  houseState: Container<Msg> = Empty
  bus: EventEmitter
  runtimeContext: RuntimeContext<Msg>
  subscriptionsManager: SubscriptionsManager<Msg>
  logStream: stream.Writable

  constructor({
    update,
    subscriptions,
    house,
    initialModel,
    runtimeContext,
    extras: { interfaces },
  }: RuntimeSpec<Model, Msg> & { runtimeContext: RuntimeContext<Msg> } & {
    extras: Extras<Msg, Model>
  }) {
    this.update = update
    this.subscriptions = subscriptions
    this.house = house
    this.model = initialModel
    this.runtimeContext = runtimeContext
    this.bus = new EventEmitter()

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
    // this.logStream = fs.createWriteStream(logPath, {flags: 'a', encoding: 'utf8', autoClose: true})
    // this.logStream = process.stderr
    this.logStream = new stream.Writable({ write: (_a, _b, cb) => cb() })
  }

  log(msg: string, payload: unknown, ts = new Date()) {
    this.logStream.write(JSON.stringify({ msg, ts, payload }))
    this.logStream.write('\n')
  }

  /**
   * Kick off the runtime.
   * From here on out, the runtime will be driven by messages from either the outside world or subscriptions.
   * There's no explicit loop.
   */
  async run(initialMsg?: Msg) {
    if (initialMsg !== undefined) {
      this.log('initialMsg', initialMsg)
      this.log('initialModel', this.model)
      const [nextModel, _] = this.update(this.model, initialMsg)
      this.log('model', nextModel)
      this.model = nextModel
    }

    console.log('initial model', this.model)
    this.bus.emit('modelChanged', this.model)
    this.subscriptionsManager.updateSubs(this.subscriptions(this.model))

    const nextHouse = this.house(this.model)
    console.log('run - first house')
    console.dir(nextHouse, { depth: null })
    this.log('firstHouse', nextHouse)
    this.houseState = await this.reifyNodeSafe(
      this.runtimeContext,
      nextHouse,
      Empty,
    )
    this.log('firstHouseState', this.houseState)
  }

  /**
   * Inject a message into the runtime.
   * After run, this is the only way to drive the runtime.
   */
  async dispatchMessage(msg: Msg) {
    this.log('dm.msg', msg)
    const [nextModel, _] = this.update(this.model, msg)
    console.log('dispatchMessage: ', msg)
    if (equal(this.model, nextModel)) {
      console.log('no change to model, no effect')
      console.dir(this.model, { depth: null })
      return
    }
    this.log('dm.model', nextModel)
    this.model = nextModel
    console.log('model after update')
    console.dir(this.model, { depth: null })
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

  /**
   * Reifies a new node from the previous node, applying side effects along the way.
   * Instead of throwing an error, it logs the error and returns the previous node.
   */
  async reifyNodeSafe<Msg>(
    ctx: RuntimeContext<Msg>,
    node: Container<Msg>,
    prevNode: Container<Msg>,
  ): Promise<Container<Msg>> {
    try {
      return reifyNode(ctx, node, prevNode)
    } catch (e) {
      console.log(`node reify failed: ${e}`)
    }
    return prevNode
  }
}

/**
 * Takes a node tree and produces a new one, applying changes and side effects on leaf nodes (devices).
 */
export async function reifyNode<Msg>(
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
      await updateNode(ctx, node, prevNode)
      delete prevChildren[key]
    } else {
      await addNode(ctx, node)
    }
  }

  for (const roomId in prevChildren) {
    await removeNode(ctx, prevChildren[roomId])
  }

  return node
}

async function updateNode<Msg>(
  ctx: RuntimeContext<Msg>,
  node: AnyNode<Msg>,
  prevNode: AnyNode<Msg>,
) {
  if (hasChildren(node)) {
    await reifyNode(ctx.push(node.key), node, prevNode)
  } else {
    await ctx.devices.update(ctx, node, prevNode)
  }
}
async function addNode<Msg>(ctx: RuntimeContext<Msg>, node: AnyNode<Msg>) {
  if (hasChildren(node)) {
    await reifyNode(ctx.push(node.key), node, Empty)
  } else {
    await ctx.devices.add(ctx, node)
  }
}
async function removeNode<Msg>(ctx: RuntimeContext<Msg>, node: AnyNode<Msg>) {
  if (hasChildren(node)) {
    await reifyNode(ctx.push(node.key), Empty, node)
  } else {
    await ctx.devices.remove(ctx, node)
  }
}

function hasChildren<Msg>(node: AnyNode<Msg>): boolean {
  return (
    'children' in node &&
    node.children !== undefined &&
    node.children.length > 0
  )
}
