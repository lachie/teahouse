process.env.TZ = 'Australia/Sydney'
import { match } from 'ts-pattern'

import { Container, Room } from './house'

import { ZLight } from './devices'
import { ZLightPayload, ZLightNode } from './devices/zLight'

import { runtime } from './runtime'
import { Batch, Sub, None } from './runtime/subscriptions'
import { Cron } from './effects/cron'

import * as mqtt from 'async-mqtt'
import { InfluxDB } from '@influxdata/influxdb-client'

import HttpInterfaceFactory from './interfaces/http'

import secrets from './secrets.json'

import {
  isHourLate,
  isKidWeek,
  Model,
  ModelCache,
  ModelCacheT,
  RoomModel,
  modelZero,
} from './lachies-house/Model'
import {
  Msg,
  SetOccupancy,
  SetHour,
  MsgT,
  SetLightOn,
  ToggleLight,
  LightState,
  LightStates,
  SetSensorRaw,
  SetZigbeeEvent,
  SetScene,
  SetValue,
  SetConst,
  ToggleBool,
} from './lachies-house/Msg'
import { InterfaceFactory } from './interfaces'
import path from 'path/posix'
import { ModelCacheFactory } from './interfaces/modelCache'
import { Mqtt } from './effects/mqtt'
import { update } from './lachies-house/update'
import { ZButton } from './devices/zButton'
import { hashMap, hashMapT } from './util/hashMap'
import { ZPresence, ZTemp } from './devices/zSensor'
import { TelegramMessage } from './devices/telegramBot'

const modelCachePath = path.resolve(__dirname, './model.json')
const logPath = path.resolve(__dirname, './log.json')

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
let initialModel: Model = modelCacheFactory.initialModel({
  doorbell: false,
  doorbellBlink: false,
  date: initialDate,
  hour: initialDate.getHours(),
  hourLate: isHourLate(initialDate),
  kidweek: isKidWeek(initialDate),
  sunProgress: [0, 'day'],
  daylightProgress: 0,
  rooms: {
    playroom: {
      occupied: false,
      sensors: {},
      scene: undefined,
    },
    backroom: {
      occupied: false,
      sensors: {},
      scene: undefined,
    },
    office: {
      occupied: false,
      sensors: {},
      scene: undefined,
    },
    bedroom: {
      occupied: false,
      sensors: {},
      scene: undefined,
    },
    sams_room: {
      occupied: false,
      sensors: {},
      scene: undefined,
    },
    pipers_room: {
      occupied: false,
      sensors: {},
      scene: undefined,
    },
  },
})

/*
 * subscriptions
 */
const subscriptions = (model: Model): Sub<Msg> =>
  Batch([
    Sub(Cron('0 * * * * *', SetHour)),
    (model.doorbell && Sub(Cron('*/2 * * * * *', ToggleBool('doorbellBlink'))))
// Sub(Mqtt('zigbee2mqtt/#', SetZigbeeEvent))
])

/*
 * house
 */
const house = (model: Model): Container<Msg> => ({
  type: 'house',
  key: 'house',
  children: [
    frontdoor(model),
    playroom(model.rooms.playroom, model),
    backroom(model.rooms.backroom, model),
    office(model.rooms.office, model),
  ],
})


const frontdoor = (model: Model): Container<Msg> => {
  return Room('frontdoor',
    ZButton.make(
      'doorbell',
      'frontdoor/button',
      SetConst('doorbell', true),
    ),
    (model.doorbell ? TelegramMessage.make("doorbell","doorbell!") : undefined)
  )
}

const scale = (v: number, min: number, max: number): number =>
  Math.sign(max - min) * v * Math.abs(max - min) + min
const sinUnit = (v: number) => Math.sin(Math.PI * v)
const sinScale = (v: number, min: number, max: number): number =>
  scale(sinUnit(v), min, max)

const shortDelay = 30 * 1000
const defaultDelay = 5 * 60 * 1000
// DEV:
// const shortDelay = 1 * 1000
// const defaultDelay = 5 * 1000

const kidWeekNoLightsAfterHour = 21


const backroom = (room: RoomModel, model: Model): Container<Msg> => {
  const [prog, dayNight] = model.sunProgress
  let temp = (dayNight === 'day') ? prog : 1.0

  console.log("backroom", room, model)

  const buttons = hashMap({
    '1_single': 'off',
    '2_single': 'morning',
    '3_single': 'daylight',
  })

  const scene = model.doorbellBlink ? 'doorbell' : room.scene
  const payload = hashMapT<ZLightPayload>({
    off: { state: 'OFF' },
    doorbell: {
      state: 'ON',
      color: { r: 255, g: 0, b: 0 },
      brightness: 255
    },
    morning: {
      white: [0.3, temp]
    },
    daylight: {
      white: [1.0, temp]
    },
  })(scene)

  return Room(
    'backroom',
    payload && ZLight.make('light1', 'ikea', 'backroom/lamp', payload),
    ZButton.make(
      'button1',
      'backroom/buttonsx3-1',
      SetScene('backroom', buttons),
    ),
    ZPresence.make('backroom', 'backroom/motion', SetSensorRaw('backroom')),
    ZTemp.make('backroom', 'backroom/temp', SetSensorRaw('backroom')),
  )
}

const office = (room: RoomModel, model: Model): Container<Msg> => {
  const [prog, dayNight] = model.sunProgress
  let temp = (dayNight === 'day') ? prog : 1.0

  const buttons = hashMap({
    '1_single': 'off',
    '2_single': 'morning',
    '2_double': 'morning2',
    '3_single': 'daylight',
    '4_single': 'purple',
    '4_double': 'blue',
  })
  const scenes = hashMapT<ZLightPayload>({
    off: { state: 'OFF' },
    morning: {
      white: [0.15, temp]
    },
    morning2: {
      white: [0.3, temp]
    },
    daylight: {
      white: [1.0, temp]
    },
    purple: { state: 'ON', brightness: 100, color: { r: 204, g: 24, b: 195 } },
    blue: { state: 'ON', brightness: 100, color: { r: 2, g: 109, b: 163 } },
  })
  const payload = scenes(room.scene)

  return Room(
    'office',
    payload && ZLight.make('light1', 'ikea', 'office/lamp', payload),
    payload && ZLight.make('light2', 'ikea', 'office/lamp-small', payload),
    ZButton.make('button1', 'switch-x4', SetScene('office', buttons)),
    ZTemp.make('office', 'office/temp', SetSensorRaw('office')),
  )
}

const playroom = (room: RoomModel, model: Model): Container<Msg> => {
  const [prog, dayNight] = model.sunProgress
  let temp = (dayNight === 'day') ? prog : 1.0

  const buttons = hashMap({
    '1_single': 'off',
    '2_single': 'morning',
    '3_single': 'daylight',
  })
  const scene = model.doorbellBlink ? 'doorbell' : room.scene
  const scenes = hashMapT<ZLightPayload>({
    off: { state: 'OFF' },
    doorbell: {
      state: 'ON',
      color: { r: 255, g: 0, b: 0 },
      brightness: 255
    },
    morning: {
      white: [0.3, temp]
    },
    daylight: {
      white: [1.0, temp]
    },
  })

  const payload = scenes(scene)

  return Room(
    'playroom',
    payload && ZLight.make('light1', 'ikea', 'playroom/lamp-desk', payload),
    payload && ZLight.make('light2', 'ikea', 'playroom/lamp-tall', payload),
    ZButton.make(
      'button1',
      'playroom/buttonsx3-1',
      SetScene('playroom', buttons),
    ),
    ZButton.make(
      'button2',
      'playroom/buttonsx3-2',
      SetScene('playroom', buttons),
    ),
    ZTemp.make('playroom', 'playroom/temp', SetSensorRaw('playroom')),
  )
}

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

const interfaces: InterfaceFactory<Msg, Model>[] = [
  new HttpInterfaceFactory(MsgT, 3030),
  modelCacheFactory,
]

runtime(
  {
    update,
    house,
    subscriptions,
    initialModel,
  },
  { mqttClient, influxClient, interfaces, logPath, secrets },
  SetHour(new Date())
)
