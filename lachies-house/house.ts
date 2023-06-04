import { match } from 'ts-pattern'

import { Container, Room } from '../src/house'
import { ZLight } from '../src/devices/zLight'
import {
  ZLightPayload,
} from '../src/devices/zLight'

import {
  Model,
  People,
  RoomModel,
  doorbellBlinking,
  OfficeRoomModel,
} from './Model'
import {
  Msg,
  SetSensorRaw,
  SetRoomSceneMap,
  SetSetValue,
  SetDelValue,
  DoorbellTrigger,
} from './Msg'
import { ZButton } from '../src/devices/zButton'
import { hashTagger } from '../src/util/hashMap'
import { ZPresence, ZTemp } from '../src/devices/zSensor'
import { TelegramMessage } from '../src/devices/telegramBot'
import { Person } from '../src/devices/person'
import { DeskCommand, DeskCtl } from '../src/devices/deskctl'
import { ShellyDimmer, ShellyDimmerPayload } from '../src/devices/shellyDimmer'

/*
 * house
 */
type HouseScenes = 'off' | 'none'
type CommonRoomScenes = 'on' | 'off'
type CommonAreaScenes = 'bedtime'
type GlobalScenes = HouseScenes | CommonRoomScenes | 'doorbell'

type PrivateArea<P> = P | CommonRoomScenes | HouseScenes
type CommonArea<P> = P | GlobalScenes | CommonAreaScenes

/*
 House is the top level container.
 It's used by the runtime to set up all the devices.
 */
export const house = (model: Model): Container<Msg> => ({
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

/**
 * Global is a virtual "room" to hold the people who may be home.
 */
const global = (_: Model): Container<Msg> => {
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
    ZButton.make('doorbell', 'frontdoor/button', DoorbellTrigger),
    model.doorbell ? TelegramMessage.make('doorbell', 'doorbell!') : undefined,
  )
}

/*
 * resolveScene* allows layered scene fallbacks
 * However, the fallback logic needs to be different based on the kind of room.
 */
/*
 * Common areas can have more intrusive scenes, such as lights blinking when the doorbell button is pushed.
 */
const resolveSceneCommonArea = <RoomScenes>(
  model: Model,
  room: RoomModel,
): CommonArea<RoomScenes> => {
  if (doorbellBlinking(model)) {
    return 'doorbell'
  }

  if (room.scene !== undefined) {
    return room.scene as unknown as CommonArea<RoomScenes>
  }

  if (model.houseScene !== undefined) {
    return model.houseScene
  }

  return 'none'
}
type CommonRoomProps<S extends string> = { model: Model, room: RoomModel, scene: CommonArea<S>, progress: number }
type CommonRoom<S extends string> = (props: CommonRoomProps<S>) => Container<Msg>
const commonRoom = <S extends string>(roomFn: CommonRoom<S>) => (room: RoomModel, model: Model): Container<Msg> => {
  const scene = resolveSceneCommonArea<S>(model, room)

  const [prog, dayNight] = model.sunProgress
  let progress = dayNight === 'day' ? prog : 1.0

  return roomFn({ model, room, scene, progress })
}

const resolveScenePrivateArea = <RoomScenes>(
  _: Model,
  room: RoomModel,
): PrivateArea<RoomScenes> => {
  const scene = room.scene
  // TODO wat
  if (scene === undefined) return 'none' as unknown as PrivateArea<RoomScenes>
  // TODO parameterise RoomModel/RoomModelT
  return room.scene as unknown as PrivateArea<RoomScenes>
}

type PrivateRoomProps<S extends string> = { model: Model, room: RoomModel, scene: PrivateArea<S>, progress: number }
type PrivateRoom<S extends string> = (props: PrivateRoomProps<S>) => Container<Msg>
const privateRoom = <S extends string>(roomFn: PrivateRoom<S>) => (room: RoomModel, model: Model): Container<Msg> => {
  const scene = resolveScenePrivateArea<S>(model, room)

  const [prog, dayNight] = model.sunProgress
  let progress = dayNight === 'day' ? prog : 1.0

  return roomFn({ model, room, scene, progress })
}

/*
 * Specific rooms
 */
const backroomScenes = ['dim', 'bright', 'work'] as const
type BackroomScenes = typeof backroomScenes[number]

const backroom = commonRoom<BackroomScenes>(({ progress, scene }): Container<Msg> => {
  const buttons = hashTagger({
    '1_single': 'off',
    '2_single': 'dim',
    '3_single': 'bright',
  })

  type Payloads = [
    Partial<ZLightPayload>,
    Partial<ZLightPayload>,
    ShellyDimmerPayload,
  ]
  const [payload, payload2, payloadSink] = match<
    CommonArea<BackroomScenes>,
    Payloads
  >(scene)
    .with('off', 'none', () => [
      ZLight.off,
      ZLight.off,
      { state: false },
    ])
    .with('doorbell', () => [
      ZLight.doorbell,
      ZLight.doorbell,
      { state: true },
    ])
    .with('dim', () => [
      ZLight.cosy(0.3, progress),
      ZLight.cosy(0.3 * 0.2, progress),
      { state: true },
    ])
    .with('bright', 'bedtime', 'on', () => [
      ZLight.cosy(1.0, progress),
      ZLight.cosy(1.0 * 0.15, progress),
      { state: true },
    ])
    .with('work', () => [
      ZLight.work,
      ZLight.work,
      { state: true },
    ])
    .exhaustive()

  return Room(
    'backroom',
    ShellyDimmer.make('sink', 'kitchen/light-sink', payloadSink),
    ZLight.make('light1', 'ikea', 'backroom/lamp', payload),
    ZLight.make('spot1', 'ikea-spot', 'backroom/spot-1', payload),
    ZLight.make('spot2', 'ikea-spot', 'backroom/spot-2', payload),
    ZLight.make('spot3', 'ikea-spot', 'backroom/spot-3', payload2),
    ZLight.make('spot4', 'ikea-spot', 'backroom/spot-4', payload2),
    ZButton.make(
      'button1',
      'backroom/buttonsx3-1',
      SetRoomSceneMap('backroom', buttons),
    ),
    ZPresence.make('backroom', 'backroom/motion', SetSensorRaw('backroom')),
    ZTemp.make('backroom', 'backroom/temp', SetSensorRaw('backroom')),
  )
})

/*
 * My bedroom
 * It's set up as a common area so I get doorbell blinks.
 */
type BedroomScenes =
  | 'dim'
  | 'bright'
  | 'work'
  | 'doorbell'
  | 'off'
const bedroom = commonRoom<BackroomScenes>(({ scene, progress }): Container<Msg> => {
  const payload = match<CommonArea<BedroomScenes>, Partial<ZLightPayload>>(scene)
    .with('off', 'none', () => ZLight.off)
    .with('doorbell', () => ZLight.doorbell) // yeah, doorbell blinking in my room
    .with('dim', () => ZLight.cosy(0.15, progress))
    .with('bright', 'bedtime', 'on', () => ZLight.cosy(1.0, progress))
    .with('work', () => ZLight.work)
    .exhaustive()

  return Room(
    'bedroom',
    ZLight.make('light1', 'ikea', 'bedroom/lamp', payload),
  )
})

/*
 * My office
 */
type OfficeScenes = 'dim' | 'morning2' | 'bright' | 'work' | 'purple' | 'blue'
const office = (room: OfficeRoomModel, model: Model): Container<Msg> => {
  return Room(
    'office',
    ZTemp.make('office', 'office/temp', SetSensorRaw('office')),
    DeskCtl.make('office', 'office/desk', room.desk.command as DeskCommand),
  )
}

/*
 * The 'playroom' where the kids do homework and we all game.
 */
type PlayroomScenes = 'dim' | 'bright' | 'work'
const playroom = commonRoom<PlayroomScenes>(({ scene, progress }): Container<Msg> => {
  const buttons = hashTagger({
    '1_single': 'off',
    '2_single': 'dim',
    '3_single': 'bright',
  })

  type Payloads = [Partial<ZLightPayload>, Partial<ZLightPayload>]

  const payload = match<
    CommonArea<PlayroomScenes>,
    Payloads
  >(scene)
    .with('off', 'none', 'bedtime', () => [ZLight.off, ZLight.off])
    .with('doorbell', () => [ZLight.doorbell, ZLight.doorbell])
    .with('dim', () => ([ZLight.cosy(0.3, progress), ZLight.cosy(0.3, progress)]))
    .with('bright', 'on', () => ([
      ZLight.cosy(1.0, progress),
      ZLight.cosy(0.15, progress),
    ]))
    .with('work', () => ([ZLight.work, ZLight.work]))
    .exhaustive()

  const [payload1, payload2] = payload

  return Room(
    'playroom',
    ZLight.make('light1', 'ikea', 'playroom/lamp-desk', payload1),
    ZLight.make('light2', 'ikea', 'playroom/lamp-tall', payload1),
    ZLight.make('light3a', 'ikea-spot', 'playroom/spot-1', payload1),
    ZLight.make('light3b', 'ikea-spot', 'playroom/spot-2', payload2),
    ZLight.make('light3c', 'ikea-spot', 'playroom/spot-3', payload1),
    ZButton.make(
      'button1',
      'playroom/buttonsx3-1',
      SetRoomSceneMap('playroom', buttons),
    ),
    ZButton.make(
      'button2',
      'playroom/buttonsx3-2',
      SetRoomSceneMap('playroom', buttons),
    ),
    ZTemp.make('playroom', 'playroom/temp', SetSensorRaw('playroom')),
  )
}
)

/*
 * The kids' bedrooms. Behaviour is the same, so its parameterised into a function and reified below.
 */
type KidRoomScenes = 'dim' | 'bright' | 'work'
const kidRoom =
  (kid: string) =>
    privateRoom<KidRoomScenes>(({ scene, progress }) => {
      const buttons_x3 = hashTagger({
        '1_single': 'off',
        '2_single': 'dim',
        '3_single': 'bright',
      })
      const payload = match<PrivateArea<KidRoomScenes>, Partial<ZLightPayload>>(
        scene,
      )
        .with('off', 'none', () => ZLight.off)
        .with('dim', () => ZLight.cosy(0.15, progress))
        .with('bright', 'on', () => ZLight.cosy(1.0, progress))
        .with('work', () => ZLight.work)
        .exhaustive()

      return Room(
        kid,
        ZLight.make('light1', 'ikea', `${kid}/lamp`, payload),
        ZButton.make(
          'button2',
          `${kid}/buttonsx3`,
          SetRoomSceneMap(kid, buttons_x3),
        ),
      )
    })

const pipers_room = kidRoom('pipers-room')
const sams_room = kidRoom('sams-room')
