import * as t from 'io-ts'
import * as tt from 'io-ts-types'
import { LightStateT, SensorReadingT } from './Msg'

export const PlayroomModelT = t.type({
  occupied: t.boolean,
  lightOn: LightStateT,
  sensors: t.record(t.string, SensorReadingT),
})
export type PlayroomModel = t.TypeOf<typeof PlayroomModelT>

/*
 * model
 */
export const ModelT = t.type({
  rooms: t.type({
    playroom: PlayroomModelT,
  }),
  date: tt.DateFromISOString,
  hour: t.number,
  hourLate: t.boolean,
  kidweek: t.boolean,
})
export type Model = t.TypeOf<typeof ModelT>

type RoomId = keyof Model['rooms']

export const ModelCacheT = t.type({
  rooms: t.type({
    playroom: t.type({
      lightOn: LightStateT,
    }),
  }),
})
export type ModelCache = t.TypeOf<typeof ModelCacheT>
