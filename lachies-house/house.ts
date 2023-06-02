import { match } from 'ts-pattern'

import { Container, Room } from '../src/house'

import { ZLight } from '../src/devices'
import {
  colour,
  cosy,
  white,
  doorbell as doorbellLight,
  off as lightOff,
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
  PushEvent,
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
import { RoomMeta } from '../src/devices/roomMeta'
import { mergeDeep } from 'immutable'
import { Match } from 'ts-pattern/lib/types/Match'
import { reifyNode } from '../src/runtime'
import { ShellyDimmer, ShellyDimmerPayload } from '../src/devices/shellyDimmer'
import { DevicePayload, MatchLine, match as matchScene } from './scenes'

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
 It may be passed to runtime.
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

/*
Global is a virtual "room" to hold the people who may be home.
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

// const matchCommonArea = <T extends DevicePayload[]>(model: Model, room: RoomModel, arity: number, matches: MatchLine<T>[]) => matchScene(model, room, resolveSceneCommonArea, arity, [
//   [['off', 'none'], { state: 'OFF' }],
//   ['doorbell',
//     {
//       state: 'ON',
//       color: { r: 255, g: 0, b: 0 },
//       brightness: 255,
//     },
//   ],
//   ...matches
// ])

type MultiPayload<T> = Partial<T>[] | Partial<T>
function unroll<T>(n: number, p: MultiPayload<T>): Partial<T>[] {
  if ('length' in p) {
    return p
  } else {
    return Array(n).fill(p)
  }
}

/*
 * Specific rooms
 */

/*
 * My backroom, where I mostly hang out and watch tv.
 */
// const backroom2 = (room: RoomModel, model: Model): Container<Msg> => {
//   const buttons = hashTagger({
//     '1_single': 'off',
//     '2_single': 'dim',
//     '3_single': 'bright',
//   })

//   const [, payload, payload2] = matchCommonArea<[Partial<ZLightPayload>, Partial<ZLightPayload>]>(model, room, 2, [
//     ['dim', cosy(0.3), cosy(0.3 * 0.2)],
//     [['bright', 'bedtime', 'on'], cosy(1.1), cosy(1.0 * 0.15)],
//     [
//       'work',
//       {
//         white: { brightness: 1.0, progress: 0.5, range: 'work' },
//       },
//     ],
//   ])

//   return Room(
//     'backroom',
//     ZLight.make('light1', 'ikea', 'backroom/lamp', payload),
//     ZLight.make('spot1', 'ikea-spot', 'backroom/spot-1', payload),
//     ZLight.make('spot2', 'ikea-spot', 'backroom/spot-2', payload),
//     ZLight.make('spot3', 'ikea-spot', 'backroom/spot-3', payload2),
//     ZLight.make('spot4', 'ikea-spot', 'backroom/spot-4', payload2),
//     ZButton.make(
//       'button1',
//       'backroom/buttonsx3-1',
//       SetRoomSceneMap('backroom', buttons),
//     ),
//     ZPresence.make('backroom', 'backroom/motion', SetSensorRaw('backroom')),
//     ZTemp.make('backroom', 'backroom/temp', SetSensorRaw('backroom')),
//   )
// }

type BackroomScenes = 'dim' | 'bright' | 'work'
const backroom = (room: RoomModel, model: Model): Container<Msg> => {
  const [prog, dayNight] = model.sunProgress
  let progress = dayNight === 'day' ? prog : 1.0

  const buttons = hashTagger({
    '1_single': 'off',
    '2_single': 'dim',
    '3_single': 'bright',
  })

  const scene = resolveSceneCommonArea<BackroomScenes>(model, room)

  type Payloads = [
    Partial<ZLightPayload>,
    Partial<ZLightPayload>,
    Partial<ShellyDimmerPayload>,
  ]
  const [payload, payload2, payloadSink] = match<
    CommonArea<BackroomScenes>,
    Payloads
  >(scene)
    .with('off', 'none', () => [
      { state: 'OFF' },
      { state: 'OFF' },
      { state: false },
    ])
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
      { state: true },
    ])
    .with('dim', () => [
      {
        white: { brightness: 0.3, progress, range: 'cosy' },
      },
      {
        white: { brightness: 0.3 * 0.2, progress, range: 'cosy' },
      },
      { state: true },
    ])
    .with('bright', 'bedtime', 'on', () => [
      {
        white: { brightness: 1.0, progress, range: 'cosy' },
      },
      {
        white: { brightness: 1.0 * 0.15, progress, range: 'cosy' },
      },
      { state: true },
    ])
    .with('work', () => [
      {
        white: { brightness: 1.0, progress: 0.5, range: 'work' }, // noon
      },
      {
        white: { brightness: 1.0, progress: 0.5, range: 'work' },
      },
      { state: true },
    ])
    .exhaustive()

  console.log('backroom', payloadSink)

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
}

/*
 * My bedroom
 */
type BedroomScenes =
  | 'dim'
  | 'morning2'
  | 'bright'
  | 'work'
  | 'purple'
  | 'blue'
  | 'on'
  | 'off'
const bedroom = (room: RoomModel, model: Model): Container<Msg> => {
  const [prog, dayNight] = model.sunProgress
  let temp = dayNight === 'day' ? prog : 1.0

  const scene = resolveSceneCommonArea<OfficeScenes>(model, room)

  const buttons = hashTagger({
    '1_single': 'off',
    '2_single': 'dim',
    '2_double': 'morning2',
    '3_single': 'bright',
    '4_single': 'purple',
    '4_double': 'blue',
  })
  const buttons_x3 = hashTagger({
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
    .with('bright', 'bedtime', 'on', () => ({
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

/*
 * My office
 */
type OfficeScenes = 'dim' | 'morning2' | 'bright' | 'work' | 'purple' | 'blue'
const office = (room: OfficeRoomModel, model: Model): Container<Msg> => {
  const [prog, dayNight] = model.sunProgress
  let temp = dayNight === 'day' ? prog : 1.0

  const scene = resolveSceneCommonArea<OfficeScenes>(model, room)

  const buttons = hashTagger({
    '1_single': 'off',
    '2_single': 'dim',
    '2_double': 'morning2',
    '3_single': 'bright',
    '4_single': 'purple',
    '4_double': 'blue',
  })
  const buttons_x3 = hashTagger({
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
    .with('bright', 'bedtime', 'on', () => ({
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
    ZButton.make('button1', 'switch-x4', SetRoomSceneMap('office', buttons)),
    ZButton.make(
      'button2',
      'office/buttonsx3',
      SetRoomSceneMap('office', buttons_x3),
    ),
    ZTemp.make('office', 'office/temp', SetSensorRaw('office')),
    DeskCtl.make('office', 'office/desk', room.desk.command as DeskCommand),
  )
}

/*
 * The 'playroom' where the kids do homework and we all game.
 */
type PlayroomScenes = 'dim' | 'bright' | 'work'
const playroom = (room: RoomModel, model: Model): Container<Msg> => {
  const [prog, dayNight] = model.sunProgress
  let progress = dayNight === 'day' ? prog : 1.0

  const buttons = hashTagger({
    '1_single': 'off',
    '2_single': 'dim',
    '3_single': 'bright',
  })
  const scene = resolveSceneCommonArea<PlayroomScenes>(model, room)
  const payload = match<
    CommonArea<PlayroomScenes>,
    MultiPayload<ZLightPayload>
  >(scene)
    .with('off', 'none', 'bedtime', lightOff)
    .with('doorbell', doorbellLight)
    .with('dim', () => cosy(0.3)(progress))
    .with('bright', 'on', () => [
      cosy(1.0)(progress),
      cosy(0.15)(progress),
    ])
    .with('work', white({ range: 'work' })(1.0))
    .exhaustive()

  const [payload1, payload2] = unroll(2, payload)

  return Room(
    'playroom',
    ZLight.make('light1', 'ikea', 'playroom/lamp-desk', payload1),
    ZLight.make('light2', 'ikea', 'playroom/lamp-tall', payload1),
    ZLight.make('light3a', 'ikea', 'playroom/spot-1', payload1),
    ZLight.make('light3b', 'ikea', 'playroom/spot-2', payload2),
    ZLight.make('light3c', 'ikea', 'playroom/spot-3', payload1),
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

/*
 * The kids' bedrooms. Behaviour is the same, so its parameterised into a function and reified below.
 */
type KidRoomScenes = 'dim' | 'bright' | 'work'
const kidRoom =
  (kid: string) =>
    (room: RoomModel, model: Model): Container<Msg> => {
      const [prog, dayNight] = model.sunProgress
      let temp = dayNight === 'day' ? prog : 1.0

      const scene = resolveScenePrivateArea<KidRoomScenes>(model, room)

      const buttons_x3 = hashTagger({
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
        .with('bright', 'on', () => ({
          white: { brightness: 1.0, progress: temp, range: 'cosy' },
        }))
        .with('work', () => ({
          white: { brightness: 1.0, progress: 0.5, range: 'work' },
        }))
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
    }

const pipers_room = kidRoom('pipers-room')
const sams_room = kidRoom('sams-room')
