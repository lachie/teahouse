process.env.TZ = 'Australia/Sydney'
import { match } from 'ts-pattern'

import { Container, Room } from './src/house'

import { ZLight } from './src/devices'
import { ZLightPayload } from './src/devices/zLight'

import { runtime } from './src/runtime'
import { Batch, Sub } from './src/runtime/subscriptions'
import { Cron } from './src/effects/cron'

import * as mqtt from 'async-mqtt'
import { InfluxDB } from '@influxdata/influxdb-client'

import HttpInterfaceFactory from './src/interfaces/http'

import secrets from './secrets.json'

import {
  isHourLate,
  isKidWeek,
  Model,
  People,
  ModelCache,
  ModelCacheT,
  RoomModel,
  modelZero,
  doorbellRinging,
  doorbellBlinking,
} from './src/lachies-house/Model'
import {
  Msg,
  SetHour,
  MsgT,
  SetSensorRaw,
  SetScene,
  ToggleBool,
  PushEvent,
  SetConst,
  SetValue,
  SetSetValue,
  SetDelValue,
} from './src/lachies-house/Msg'
import { InterfaceFactory } from './src/interfaces'
import path from 'path/posix'
import { ModelCacheFactory } from './src/interfaces/modelCache'
import { update } from './src/lachies-house/update'
import { ZButton } from './src/devices/zButton'
import { hashMap, hashMapT } from './src/util/hashMap'
import { ZPresence, ZTemp } from './src/devices/zSensor'
import { TelegramMessage } from './src/devices/telegramBot'
import { Dhcp } from './src/effects/dhcp'
import { Person } from './src/devices/person'

const modelCachePath = path.resolve(__dirname, './model.json')
const logPath = path.resolve(__dirname, './log.json')
const oauthDBPath = path.resolve(__dirname, './oauthDB.json')

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
  userPresenceEvents: [],
  date: initialDate,
  hour: initialDate.getHours(),
  hourLate: isHourLate(initialDate),
  kidweek: isKidWeek(initialDate),
  sunProgress: [0, 'day'],
  daylightProgress: 0,
  houseScene: 'none',
  people: [],
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

// const mmm = (s: X): Y|undefined => match<X,Y>(s)

const subscriptions = (model: Model): Sub<Msg> =>
  Batch([
    Sub(Cron('0 * * * * *', SetHour)),
    doorbellRinging(model) &&
      Sub(Cron('*/2 * * * * *', ToggleBool('doorbellBlink'))),
    // Sub(
    //   Dhcp((s: string): Msg | undefined =>
    //     match<string, Msg | undefined>(s)
    //       .with('3a:19:6e:65:3d:f3', PushEvent('userPresenceEvents', 'lachie'))
    //       .otherwise(() => undefined),
    //   ),
    // ),
    // Sub(Mqtt('zigbee2mqtt/#', SetZigbeeEvent))
  ])

/*
 * house
 */
type HouseScenes = 'off' | 'none'
type CommonAreaScenes = 'bedtime'
type GlobalScenes = HouseScenes | 'doorbell'

type PrivateArea<P> = P | HouseScenes
type CommonArea<P> = P | GlobalScenes | CommonAreaScenes

const house = (model: Model): Container<Msg> => ({
  type: 'house',
  key: 'house',
  children: [
    global(model),
    frontdoor(model),
    playroom(model.rooms.playroom, model),
    backroom(model.rooms.backroom, model),
    bedroom(model.rooms.bedroom, model),
    office(model.rooms.office, model),
    pipers_room(model.rooms['pipers-room'], model),
    sams_room(model.rooms['sams-room'], model),
  ],
})

const global = (model: Model): Container<Msg> => {
  const person = (key: keyof typeof People) =>
    Person.make(
      key,
      key,
      People[key].macs,
      SetSetValue('people', key),
      SetDelValue('people', key),
    )
  return {
    type: 'global',
    key: 'global',
    children: [person('dad'), person('piper'), person('sam')],
  }
}

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

const resolveSceneCommonArea = <RoomScenes>(
  model: Model,
  room: RoomModel,
): RoomScenes | GlobalScenes => {
  if (doorbellBlinking(model)) {
    return 'doorbell'
  }

  if (room.scene !== undefined) {
    return room.scene as unknown as RoomScenes
  }

  if (model.houseScene !== undefined) {
    return model.houseScene
  }

  return 'none'
}

const resolveScenePrivateArea = <RoomScenes>(
  _: Model,
  room: RoomModel,
): RoomScenes => {
  const scene = room.scene
  // TODO wat
  if (scene === undefined) return 'none' as unknown as RoomScenes
  // TODO parameterise RoomModel/RoomModelT
  return room.scene as unknown as RoomScenes
}

const shortDelay = 30 * 1000
const defaultDelay = 5 * 60 * 1000
// DEV:
// const shortDelay = 1 * 1000
// const defaultDelay = 5 * 1000

const kidWeekNoLightsAfterHour = 21

type NullPartial<X> = Partial<X> | undefined
type Payloads = [Partial<ZLightPayload>, Partial<ZLightPayload>]

type BackroomScenes = 'dim' | 'bright' | 'work'
const backroom = (room: RoomModel, model: Model): Container<Msg> => {
  const [prog, dayNight] = model.sunProgress
  let progress = dayNight === 'day' ? prog : 1.0

  const buttons = hashMap({
    '1_single': 'off',
    '2_single': 'dim',
    '3_single': 'bright',
  })

  const scene = resolveSceneCommonArea<BackroomScenes>(model, room)
  const [payload, payload2] = match<CommonArea<BackroomScenes>, Payloads>(scene)
    .with('off', 'none', () => [{ state: 'OFF' }, { state: 'OFF' }])
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
        white: { brightness: 0.3, progress, range: 'cosy' },
      },
      {
        white: { brightness: 0.3 * 0.2, progress, range: 'cosy' },
      },
    ])
    .with('bright', 'bedtime', () => [
      {
        white: { brightness: 1.0, progress, range: 'cosy' },
      },
      {
        white: { brightness: 1.0 * 0.15, progress, range: 'cosy' },
      },
    ])
    .with('work', () => [
      {
        white: { brightness: 1.0, progress: 0.5, range: 'work' }, // noon
      },
      {
        white: { brightness: 1.0, progress: 0.5, range: 'work' },
      },
    ])
    .exhaustive()

  return Room(
    'backroom',
    ZLight.make('light1', 'ikea', 'backroom/lamp', payload),
    ZLight.make('spot1', 'ikea-spot', 'backroom/spot-1', payload),
    ZLight.make('spot2', 'ikea-spot', 'backroom/spot-2', payload),
    ZLight.make('spot3', 'ikea-spot', 'backroom/spot-3', payload2),
    ZLight.make('spot4', 'ikea-spot', 'backroom/spot-4', payload2),
    ZButton.make(
      'button1',
      'backroom/buttonsx3-1',
      SetScene('backroom', buttons),
    ),
    ZPresence.make('backroom', 'backroom/motion', SetSensorRaw('backroom')),
    ZTemp.make('backroom', 'backroom/temp', SetSensorRaw('backroom')),
  )
}

type BedroomScenes = 'dim' | 'morning2' | 'bright' | 'work' | 'purple' | 'blue'
const bedroom = (room: RoomModel, model: Model): Container<Msg> => {
  const [prog, dayNight] = model.sunProgress
  let temp = dayNight === 'day' ? prog : 1.0

  const scene = resolveSceneCommonArea<OfficeScenes>(model, room)

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
  const payload = match<CommonArea<OfficeScenes>, Partial<ZLightPayload>>(scene)
    .with('off', 'none', () => ({ state: 'OFF' }))
    .with('dim', () => ({
      white: { brightness: 0.15, progress: temp, range: 'cosy' },
    }))
    .with('morning2', () => ({
      white: { brightness: 0.3, progress: temp, range: 'cosy' },
    }))
    .with('bright', 'bedtime', () => ({
      white: { brightness: 1.0, progress: temp, range: 'cosy' },
    }))
    .with('work', () => ({
      white: { brightness: 1.0, progress: 0.5, range: 'work' },
    }))
    .with('purple', () => ({
      state: 'ON',
      brightness: 100,
      color: { r: 204, g: 24, b: 195 },
    }))
    .with('blue', () => ({
      state: 'ON',
      brightness: 100,
      color: { r: 2, g: 109, b: 163 },
    }))
    .with('doorbell', () => ({
      state: 'ON',
      color: { r: 255, g: 0, b: 0 },
      brightness: 255,
    }))
    .exhaustive()

  return Room(
    'bedroom',
    ZLight.make('light1', 'ikea', 'bedroom/lamp', payload),
    // ZLight.make('light2', 'ikea', 'office/lamp-small', payload),
    // ZButton.make('button1', 'switch-x4', SetScene('office', buttons)),
    // ZButton.make('button2', 'office/buttonsx3', SetScene('office', buttons_x3)),
    // ZTemp.make('office', 'office/temp', SetSensorRaw('office')),
  )
}

type OfficeScenes = 'dim' | 'morning2' | 'bright' | 'work' | 'purple' | 'blue'
const office = (room: RoomModel, model: Model): Container<Msg> => {
  const [prog, dayNight] = model.sunProgress
  let temp = dayNight === 'day' ? prog : 1.0

  const scene = resolveSceneCommonArea<OfficeScenes>(model, room)

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
  const payload = match<CommonArea<OfficeScenes>, Partial<ZLightPayload>>(scene)
    .with('off', 'none', () => ({ state: 'OFF' }))
    .with('dim', () => ({
      white: { brightness: 0.15, progress: temp, range: 'cosy' },
    }))
    .with('morning2', () => ({
      white: { brightness: 0.3, progress: temp, range: 'cosy' },
    }))
    .with('bright', 'bedtime', () => ({
      white: { brightness: 1.0, progress: temp, range: 'cosy' },
    }))
    .with('work', () => ({
      white: { brightness: 1.0, progress: 0.5, range: 'work' },
    }))
    .with('purple', () => ({
      state: 'ON',
      brightness: 100,
      color: { r: 204, g: 24, b: 195 },
    }))
    .with('blue', () => ({
      state: 'ON',
      brightness: 100,
      color: { r: 2, g: 109, b: 163 },
    }))
    .with('doorbell', () => ({
      state: 'ON',
      color: { r: 255, g: 0, b: 0 },
      brightness: 255,
    }))
    .exhaustive()

  return Room(
    'office',
    ZLight.make('light1', 'ikea', 'office/lamp', payload),
    ZLight.make('light2', 'ikea', 'office/lamp-small', payload),
    ZButton.make('button1', 'switch-x4', SetScene('office', buttons)),
    ZButton.make('button2', 'office/buttonsx3', SetScene('office', buttons_x3)),
    ZTemp.make('office', 'office/temp', SetSensorRaw('office')),
  )
}

type PlayroomScenes = 'dim' | 'bright' | 'work'
const playroom = (room: RoomModel, model: Model): Container<Msg> => {
  const [prog, dayNight] = model.sunProgress
  let progress = dayNight === 'day' ? prog : 1.0

  const buttons = hashMap({
    '1_single': 'off',
    '2_single': 'dim',
    '3_single': 'bright',
  })
  const scene = resolveSceneCommonArea<PlayroomScenes>(model, room)
  const payload = match<CommonArea<PlayroomScenes>, Partial<ZLightPayload>>(
    scene,
  )
    .with('off', 'none', 'bedtime', () => ({ state: 'OFF' }))
    .with('doorbell', () => ({
      state: 'ON',
      color: { r: 255, g: 0, b: 0 },
      brightness: 255,
    }))
    .with('dim', () => ({
      white: { brightness: 0.3, progress, range: 'cosy' },
    }))
    .with('bright', () => ({
      white: { brightness: 1.0, progress, range: 'cosy' },
    }))
    .with('work', () => ({
      white: { brightness: 1.0, progress: 0.5, range: 'work' },
    }))
    .exhaustive()

  return Room(
    'playroom',
    ZLight.make('light1', 'ikea', 'playroom/lamp-desk', payload),
    ZLight.make('light2', 'ikea', 'playroom/lamp-tall', payload),
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

type KidRoomScenes = 'dim' | 'bright' | 'work'
const kidRoom =
  (kid: string) =>
  (room: RoomModel, model: Model): Container<Msg> => {
    const [prog, dayNight] = model.sunProgress
    let temp = dayNight === 'day' ? prog : 1.0

    const scene = resolveScenePrivateArea<KidRoomScenes>(model, room)

    const buttons_x3 = hashMap({
      '1_single': 'off',
      '2_single': 'dim',
      '3_single': 'bright',
    })
    const payload = match<PrivateArea<KidRoomScenes>, Partial<ZLightPayload>>(
      scene,
    )
      .with('off', 'none', () => ({ state: 'OFF' }))
      .with('dim', () => ({
        white: { brightness: 0.15, progress: temp, range: 'cosy' },
      }))
      .with('bright', () => ({
        white: { brightness: 1.0, progress: temp, range: 'cosy' },
      }))
      .with('work', () => ({
        white: { brightness: 1.0, progress: 0.5, range: 'work' },
      }))
      .exhaustive()

    return Room(
      kid,
      ZLight.make('light1', 'ikea', `${kid}/lamp`, payload),
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
  new HttpInterfaceFactory(MsgT, oauthDBPath, 3030),
  modelCacheFactory,
]

;(async () => {
  await runtime(
    {
      update,
      house,
      subscriptions,
      initialModel,
    },
    { mqttClient, influxClient, interfaces, logPath, secrets },
    SetHour(new Date()),
  )
})()
