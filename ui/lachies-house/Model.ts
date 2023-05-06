import * as t from 'io-ts'
import * as tt from 'io-ts-types'
import { SensorReadingT } from './Msg'
import { addDays, differenceInCalendarDays, addWeeks } from 'date-fns'
import * as SunCalc from 'suncalc'

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
      }
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

export const RoomModelT = t.type({
  occupied: t.boolean,
  scene: t.union([t.undefined, t.string]),
  sensors: t.record(t.string, SensorReadingT),
})
export type RoomModel = t.TypeOf<typeof RoomModelT>

export const BackroomModelT = RoomModelT
export type BackroomModel = RoomModel

export const OfficeRoomModelT = t.intersection([RoomModelT, t.type({
  desk: t.type({command: t.string})
})])
export type OfficeRoomModel = t.TypeOf<typeof OfficeRoomModelT>

export const SunProgress = t.tuple([
  t.number,
  t.keyof({ day: null, night: null }),
])
export type SunProgress = t.TypeOf<typeof SunProgress>

const optionalT = (x: t.Mixed) => t.union([t.undefined, x])

/*
 * model
 */
export const ModelT = t.type({
  rooms: t.type({
    playroom: RoomModelT,
    backroom: RoomModelT,
    office: OfficeRoomModelT,
    'sams-room': RoomModelT,
    'pipers-room': RoomModelT,
    bedroom: RoomModelT,
  }),
  people: t.readonlyArray(t.string),
  doorbell: t.boolean,
  doorbellBlink: t.boolean,
  doorbellEvents: t.array(
    t.tuple([
      tt.DateFromISOString,
      t.keyof({ triggered: null, cancelled: null }),
    ]),
  ),
  userPresenceEvents: t.array(t.tuple([tt.DateFromISOString, t.string])),
  date: tt.DateFromISOString,
  hour: t.number,
  hourLate: t.boolean,
  kidweek: t.boolean,
  sunProgress: SunProgress,
  daylightProgress: t.number,
  houseScene: optionalT(t.string),
})
export type Model = t.TypeOf<typeof ModelT>

export type RoomKey = keyof Model['rooms']
export const roomKeys = Object.keys(ModelT.props.rooms.props) as RoomKey[]

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
      }
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

const RoomCacheT = t.partial({
  scene: t.string,
  sensors: t.record(t.string, SensorReadingT),
})

export const ModelCacheT = t.type({
  rooms: t.type({
    playroom: RoomCacheT,
    backroom: RoomCacheT,
    office: RoomCacheT,
  }),
})
export type ModelCache = t.TypeOf<typeof ModelCacheT>

const kidWeekReference = new Date('2021-08-21')

export function adjustKidweek(from: Date, to: 'kid'|'non'): Date {
  const kidWeek = isKidWeek(from) 

  switch(to) {
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
