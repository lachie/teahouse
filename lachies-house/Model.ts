import * as t from 'io-ts'
import * as tt from 'io-ts-types'
import { LightStateT, SensorReadingT } from './Msg'
import { addDays, differenceInCalendarDays, nextDay } from 'date-fns'
import * as SunCalc from 'suncalc'

export const RoomModelT = t.type({
  occupied: t.boolean,
  scene: t.union([t.undefined, t.string]),
  sensors: t.record(t.string, SensorReadingT),
})
export type RoomModel = t.TypeOf<typeof RoomModelT>

export const BackroomModelT = RoomModelT
export type BackroomModel = RoomModel

export const SunProgress = t.tuple([t.number,t.keyof({day:null, night: null})])
export type SunProgress = t.TypeOf<typeof SunProgress>

/*
 * model
 */
export const ModelT = t.type({
  rooms: t.type({
    playroom: RoomModelT,
    backroom: RoomModelT,
    office: RoomModelT,
    sams_room: RoomModelT,
    pipers_room: RoomModelT,
    bedroom: RoomModelT,
  }),
  doorbell: t.boolean,
  doorbellBlink: t.boolean,
  date: tt.DateFromISOString,
  hour: t.number,
  hourLate: t.boolean,
  kidweek: t.boolean,
  sunProgress: SunProgress,
  daylightProgress: t.number
})
export type Model = t.TypeOf<typeof ModelT>

export const modelZero = {
        rooms: {
          playroom: { lightOn: 'detect', occupied: false },
          office: {},
          backroom: {},
        },
      }

type RoomId = keyof Model['rooms']

const RoomCacheT = t.partial({ scene: t.string, sensors: t.record(t.string, SensorReadingT) })

export const ModelCacheT = t.type({
  rooms: t.type({
    playroom: RoomCacheT,
    backroom: RoomCacheT,
    office: RoomCacheT,
  }),
})
export type ModelCache = t.TypeOf<typeof ModelCacheT>

// I've got my kids every other fortnight, for a fortnight
export function isKidWeek(date: Date): boolean {
  const kidWeekRef = new Date('2021-08-21')
  const delta = differenceInCalendarDays(date, kidWeekRef)
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

  const toUnit = (v: Date, min: Date, max: Date): number => (v.getTime()-min.getTime()) / (max.getTime()-min.getTime())

  if (date >= sunrise) {
    if (date < sunset) {
      return [toUnit(date, sunrise, sunset), 'day']
    }
    const { sunrise: nextSunrise } = SunCalc.getTimes(addDays(date, 1), latitude, longitude)
    return [toUnit(date, sunset, nextSunrise), 'night']
  } else {
    const { sunset: prevSunset } = SunCalc.getTimes(addDays(date, -1), latitude, longitude)
    return [toUnit(date, prevSunset, sunrise), 'night']
  }
}