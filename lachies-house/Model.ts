import { SensorReadingT } from './Msg'
import { addDays, differenceInCalendarDays, addWeeks } from 'date-fns'
import * as SunCalc from 'suncalc'
import * as z from 'zod'

const roomZero = <T = undefined>(extra: T): RoomModel & T => ({
  occupied: false,
  sensors: {},
  scene: undefined,
  ...extra,
})
export function initialModel(initialDate: Date): Model {
  return {
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
      playroom: roomZero({}),
      backroom: roomZero({}),
      storage: roomZero({}),
      office: roomZero({
        desk: {
          command: 'idle',
        },
      }),
      bedroom: roomZero({}),
      'sams-room': roomZero({}),
      'pipers-room': roomZero({}),
    },
  }
}

export type Person = {
  name: string
  macs: string[]
}
export type People = 'dad' | 'sam' | 'piper'
export const People: Record<People, Person> = {
  dad: {
    macs: ['3A:19:6E:65:3D:F3'],
    name: 'Dad',
  },
  sam: {
    macs: ['E0:D0:83:76:05:C5'],
    name: 'Sam',
  },
  piper: {
    macs: ['4A:12:D3:13:6A:01'],
    name: 'Piper',
  },
}

const peopleKeys = Object.keys(People) as People[]

const people = (keys: readonly string[]): Person[] =>
  peopleKeys
    .filter((key) => keys.includes(key))
    .map((key) => People[key as People])

export const present = (model: Model): Person[] => people(model.people)
const away = (model: Model): Person[] => []
const guests = (model: Model): Person[] => []

// const v8 = require('v8');
// const structuredClone = <T>(obj: T): T => v8.deserialize(v8.serialize(obj))

export const RoomModelT = z.object({
  occupied: z.boolean(),
  scene: z.union([z.undefined(), z.string()]),
  sensors: z.record(z.string(), SensorReadingT),
})
export type RoomModel = z.infer<typeof RoomModelT>

export const BackroomModelT = RoomModelT
export type BackroomModel = RoomModel

export const OfficeRoomModelT = z.intersection(
  RoomModelT,
  z.object({
    desk: z.object({ command: z.string() }),
  }),
)
export type OfficeRoomModel = z.infer<typeof OfficeRoomModelT>

export const SunProgress = z.tuple([
  z.number(),
  z.enum(['day', 'night']),
])
export type SunProgress = z.infer<typeof SunProgress>

/*
 * model
 */
export const ModelT = z.object({
  rooms: z.object({
    playroom: RoomModelT,
    backroom: RoomModelT,
    office: OfficeRoomModelT,
    'sams-room': RoomModelT,
    'pipers-room': RoomModelT,
    bedroom: RoomModelT,
    storage: RoomModelT,
  }),
  people: z.array(z.string()),
  doorbell: z.boolean(),
  doorbellBlink: z.boolean(),
  doorbellEvents: z.array(
    z.tuple([
      z.coerce.date(),
      z.enum(['triggered', 'cancelled']),
    ]),
  ),
  userPresenceEvents: z.array(z.tuple([z.coerce.date(), z.string()])),
  date: z.coerce.date(),
  hour: z.number(),
  hourLate: z.boolean(),
  kidweek: z.boolean(),
  sunProgress: SunProgress,
  daylightProgress: z.number(),
  houseScene: z.string().optional(),
})
export type Model = z.infer<typeof ModelT>

export type RoomKey = keyof Model['rooms']
export const roomKeys = ModelT.shape.rooms.keyof().options


// export const modelZero = {
//   rooms: {
//     playroom: { lightOn: 'detect', occupied: false },
//     office: {},
//     backroom: {},
//   },
// }

export const modelZero: Model = {
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
      desk: {
        command: 'idle',
      },
    },
    bedroom: {
      occupied: false,
      sensors: {},
      scene: undefined,
    },
    storage: {
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
  people: [],
  doorbell: false,
  doorbellBlink: false,
  doorbellEvents: [],
  userPresenceEvents: [],
  date: new Date(),
  hour: 0,
  hourLate: false,
  kidweek: false,
  sunProgress: [0, 'day'],
  daylightProgress: 0,
  houseScene: undefined,
}

export function newModel(): Model {
  return structuredClone(modelZero)
}

type RoomId = keyof Model['rooms']

const RoomCacheT = z.object({
  scene: z.string(),
  sensors: z.record(z.string(), SensorReadingT),
}).partial()

export const ModelCacheT = z.object({
  rooms: z.object({
    playroom: RoomCacheT,
    backroom: RoomCacheT,
    office: RoomCacheT,
  }),
})
export type ModelCache = z.infer<typeof ModelCacheT>

const kidWeekReference = new Date('2021-08-21')

export function adjustKidweek(from: Date, to: 'kid' | 'non'): Date {
  const kidWeek = isKidWeek(from)

  switch (to) {
    case 'kid':
      return kidWeek ? from : addDays(from, 14)
    case 'non':
      return kidWeek ? addDays(from, 14) : from
  }
}

// I've got my kids every other fortnight, for a fortnight
export function isKidWeek(date: Date): boolean {
  const delta = differenceInCalendarDays(date, kidWeekReference)
  const fortnight = Math.floor(delta / 14)

  return fortnight % 2 == 0
}

// Is it late?
export function isHourLate(date: Date): boolean {
  const hour = date.getHours()
  return hour < 6 || (isKidWeek(date) ? hour >= 21 : hour >= 23)
}

export function sunProgress(date: Date): SunProgress {
  const latitude = -33.756171
  const longitude = 151.214681

  const t = SunCalc.getTimes(date, latitude, longitude)

  console.log(t)

  const { sunrise, sunset } = t

  const toUnit = (v: Date, min: Date, max: Date): number =>
    (v.getTime() - min.getTime()) / (max.getTime() - min.getTime())

  if (date >= sunrise) {
    if (date < sunset) {
      return [toUnit(date, sunrise, sunset), 'day']
    }
    const { sunrise: nextSunrise } = SunCalc.getTimes(
      addDays(date, 1),
      latitude,
      longitude,
    )
    return [toUnit(date, sunset, nextSunrise), 'night']
  } else {
    const { sunset: prevSunset } = SunCalc.getTimes(
      addDays(date, -1),
      latitude,
      longitude,
    )
    return [toUnit(date, prevSunset, sunrise), 'night']
  }
}

export const doorbellRinging = ({ doorbellEvents }: Model): boolean => {
  const last = doorbellEvents[doorbellEvents.length - 1]
  if (last !== undefined) {
    return last[1] == 'triggered'
  }
  return false
}
export const doorbellBlinking = (model: Model): boolean =>
  doorbellRinging(model) ? model.doorbellBlink : false
