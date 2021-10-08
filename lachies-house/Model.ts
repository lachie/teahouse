import * as t from 'io-ts'
import * as tt from 'io-ts-types'

export const PlayroomModelT = t.type({
  occupied: t.boolean,
  lightOn: t.keyof({ on: null, off: null, detect: null }),
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
