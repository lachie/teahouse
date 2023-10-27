process.env.TZ = 'Australia/Sydney'

import {
  house,
  update,
  initialModel as makeInitialModel,
  Model,
  ModelCache,
  ModelCacheT,
  modelZero,
} from './lachies-house/index'
import { Msg, SetHour, MsgT } from './lachies-house/Msg'
import { subscriptions } from './lachies-house/subscriptions'

import { runtime } from './src/runtime'
import { InterfaceFactory } from './src/interfaces'

import * as mqtt from 'async-mqtt'
import { InfluxDB } from '@influxdata/influxdb-client'

import HttpInterfaceFactory from './src/interfaces/http'
import { ModelCacheFactory } from './src/interfaces/modelCache'

import path from 'path/posix'

import secrets from './secrets.json'
import { InfluxMetrics } from './src/metrics/metrics'

const logPath = path.resolve(__dirname, './log.json')
const oauthDBPath = path.resolve(__dirname, './oauthDB.json')

const modelCachePath = path.resolve(__dirname, './model.json')

const modelCacheFactory = new ModelCacheFactory<Model, ModelCache, Msg>(
  modelCachePath,
  ModelCacheT,
  modelZero,
  (m: Model): ModelCache => ({
    rooms: {
      playroom: {
        scene: m.rooms.playroom.scene,
        sensors: m.rooms.playroom.sensors,
      },
      backroom: {
        scene: m.rooms.backroom.scene,
        sensors: m.rooms.backroom.sensors,
      },
      office: {
        scene: m.rooms.office.scene,
        sensors: m.rooms.office.sensors,
      },
    },
  }),
)

const initialDate = new Date()
export let initialModel: Model = modelCacheFactory.initialModel(
  makeInitialModel(initialDate),
)

/*
 * runtime
 */
const mqttClient = mqtt.connect(secrets.mqtt.broker, {
  username: secrets.mqtt.username,
  password: secrets.mqtt.password,
})

const influxClient = new InfluxDB({
  url: secrets.influx.url,
  token: secrets.influx.token,
}).getWriteApi(secrets.influx.org, secrets.influx.bucket)

const metrics = new InfluxMetrics(influxClient, ['house'])

const interfaces: InterfaceFactory<Msg, Model>[] = [
  new HttpInterfaceFactory(MsgT, 3030),
  modelCacheFactory,
]

  ; (async () => {
    await runtime(
      {
        update,
        house,
        subscriptions,
        initialModel,
      },
      { mqttClient, influxClient, metrics, interfaces, logPath, secrets },
      SetHour(new Date()), // initial message
    )
  })()
