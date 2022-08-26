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
import immutable from 'object-path-immutable'

import {
  isHourLate,
  isKidWeek,
  Model,
  ModelCache,
  ModelCacheT,
  RoomModel,
  modelZero,
  doorbellRinging,
  doorbellBlinking,
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
  SetConsts,
  PushEvent,
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
  doorbellEvents: [],
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
    'sams-room': {
      occupied: false,
      sensors: {},
      scene: undefined,
    },
    'pipers-room': {
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
    doorbellRinging(model) &&
      Sub(Cron('*/2 * * * * *', ToggleBool('doorbellBlink'))),
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
    pipers_room(model.rooms['pipers-room'], model),
    sams_room(model.rooms['sams-room'], model),
  ],
})

const frontdoor = (model: Model): Container<Msg> => {
  return Room(
    'frontdoor',
    // ZButton.make('doorbell', 'frontdoor/button', SetConsts([['doorbell', true], ['lastDoorbell', new Date]])),
    ZButton.make(
      'doorbell',
      'frontdoor/button',
      PushEvent('doorbellEvents', 'triggered'),
    ),
    model.doorbell ? TelegramMessage.make('doorbell', 'doorbell!') : undefined,
  )
}

const shortDelay = 30 * 1000
const defaultDelay = 5 * 60 * 1000
// DEV:
// const shortDelay = 1 * 1000
// const defaultDelay = 5 * 1000

const kidWeekNoLightsAfterHour = 21

type NullPartial<X> = Partial<X> | undefined
type Payloads = [NullPartial<ZLightPayload>, NullPartial<ZLightPayload>]

const backroom = (room: RoomModel, model: Model): Container<Msg> => {
  const [prog, dayNight] = model.sunProgress
  let temp = dayNight === 'day' ? prog : 1.0

  console.log('backroom', room, model)

  const buttons = hashMap({
    '1_single': 'off',
    '2_single': 'dim',
    '3_single': 'bright',
  })

  const scene = doorbellBlinking(model) ? 'doorbell' : room.scene
  const [payload, payload2] = match<string | undefined, Payloads>(scene)
    .with('off', () => [{ state: 'OFF' }, { state: 'OFF' }])
    .with('doorbell', () => [
      {
        state: 'ON',
        color: { r: 255, g: 0, b: 0 },
        brightness: 255,
      },
      {
        state: 'ON',
        color: { r: 255, g: 0, b: 0 },
        brightness: 255 * 0.25,
      },
    ])
    .with('dim', () => [
      {
        white: [0.3, temp, 'cosy'],
      },
      {
        white: [0.3 * 0.2, temp, 'cosy'],
      },
    ])
    .with('bright', () => [
      {
        white: [1.0, temp, 'cosy'],
      },
      {
        white: [1.0 * 0.15, temp, 'cosy'],
      },
    ])
    .with('work', () => [
      {
        white: [1.0, 0.5, 'work'], // noon
      },
      {
        white: [1.0, 0.5, 'work'],
      },
    ])
    .otherwise(() => [undefined, undefined])

  return Room(
    'backroom',
    payload && ZLight.make('light1', 'ikea', 'backroom/lamp', payload),
    payload && ZLight.make('spot1', 'ikea-spot', 'backroom/spot-1', payload),
    payload && ZLight.make('spot2', 'ikea-spot', 'backroom/spot-2', payload),
    payload2 && ZLight.make('spot3', 'ikea-spot', 'backroom/spot-3', payload2),
    payload2 && ZLight.make('spot4', 'ikea-spot', 'backroom/spot-4', payload2),
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
  let temp = dayNight === 'day' ? prog : 1.0

  const scene = doorbellBlinking(model) ? 'doorbell' : room.scene

  const buttons = hashMap({
    '1_single': 'off',
    '2_single': 'dim',
    '2_double': 'morning2',
    '3_single': 'bright',
    '4_single': 'purple',
    '4_double': 'blue',
  })
  const buttons_x3 = hashMap({
    '1_single': 'off',
    '2_single': 'dim',
    '3_single': 'bright',
  })
  const scenes = hashMapT<ZLightPayload>({
    off: { state: 'OFF' },
    dim: {
      white: [0.15, temp, 'cosy'],
    },
    morning2: {
      white: [0.3, temp, 'cosy'],
    },
    bright: {
      white: [1.0, temp, 'cosy'],
    },
    work: {
      white: [1.0, 0.5, 'work'],
    },
    purple: { state: 'ON', brightness: 100, color: { r: 204, g: 24, b: 195 } },
    blue: { state: 'ON', brightness: 100, color: { r: 2, g: 109, b: 163 } },
    doorbell: {
      state: 'ON',
      color: { r: 255, g: 0, b: 0 },
      brightness: 255,
    },
  })
  const payload = scenes(scene)

  return Room(
    'office',
    payload && ZLight.make('light1', 'ikea', 'office/lamp', payload),
    payload && ZLight.make('light2', 'ikea', 'office/lamp-small', payload),
    ZButton.make('button1', 'switch-x4', SetScene('office', buttons)),
    ZButton.make('button2', 'office/buttonsx3', SetScene('office', buttons_x3)),
    ZTemp.make('office', 'office/temp', SetSensorRaw('office')),
  )
}

const playroom = (room: RoomModel, model: Model): Container<Msg> => {
  const [prog, dayNight] = model.sunProgress
  let temp = dayNight === 'day' ? prog : 1.0

  const buttons = hashMap({
    '1_single': 'off',
    '2_single': 'dim',
    '3_single': 'bright',
  })
  const scene = doorbellBlinking(model) ? 'doorbell' : room.scene
  const scenes = hashMapT<ZLightPayload>({
    off: { state: 'OFF' },
    doorbell: {
      state: 'ON',
      color: { r: 255, g: 0, b: 0 },
      brightness: 255,
    },
    dim: {
      white: [0.3, temp, 'cosy'],
    },
    bright: {
      white: [1.0, temp, 'cosy'],
    },
    work: {
      white: [1.0, 0.5, 'work'],
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


const kidRoom =
  (kid: string) =>
  (room: RoomModel, model: Model): Container<Msg> => {
    const [prog, dayNight] = model.sunProgress
    let temp = dayNight === 'day' ? prog : 1.0

    const scene = doorbellBlinking(model) ? 'doorbell' : room.scene

    const buttons_x3 = hashMap({
      '1_single': 'off',
      '2_single': 'dim',
      '3_single': 'bright',
    })
    const payload = match<string | undefined, NullPartial<ZLightPayload>>(scene)
      .with('off', () => ({ state: 'OFF' }))
      .with('dim', () => ({
        white: [0.15, temp, 'cosy'],
      }))
      .with('bright', () => ({
        white: [1.0, temp, 'cosy'],
      }))
      .with('work', () => ({
        white: [1.0, 0.5, 'work'],
      }))
      .otherwise(() => undefined)

    return Room(
      kid,
      payload && ZLight.make('light1', 'ikea', `${kid}/lamp`, payload),
      ZButton.make('button2', `${kid}/buttonsx3`, SetScene(kid, buttons_x3)),
    )
  }

const pipers_room = kidRoom('pipers-room')
const sams_room = kidRoom('sams-room')

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
  SetHour(new Date()),
)
