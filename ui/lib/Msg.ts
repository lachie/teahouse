import * as t from 'io-ts'
import * as tt from 'io-ts-types'

/*
 * message
 */

export const SetOccupancyT = t.type({
  type: t.literal('set-occupancy'),
  room: t.string,
  occupied: t.boolean,
})

export type SetOccupancy = t.TypeOf<typeof SetOccupancyT>
// type SetOccupancy = { type: 'set-occupancy'; room: string; occupied: boolean }
export const SetOccupancy =
  (room: string) =>
  (occupied: boolean): SetOccupancy => ({
    type: 'set-occupancy',
    room,
    occupied,
  })

export const LightStateT = t.keyof({ on: null, off: null, detect: null })
export type LightState = t.TypeOf<typeof LightStateT>
export const LightStates: LightState[] = ['on', 'off', 'detect']

export const SetLightOnT = t.type({
  type: t.literal('set-light-on'),
  room: t.string,
  lightOn: LightStateT,
})
export type SetLightOn = t.TypeOf<typeof SetLightOnT>
export const SetLightOn =
  (room: string) =>
  (lightOn: LightState): SetLightOn => ({
    type: 'set-light-on',
    room,
    lightOn,
  })

export const ToggleLightT = t.type({
  type: t.literal('toggle-light'),
  room: t.string,
})
export type ToggleLight = t.TypeOf<typeof ToggleLightT>
export const ToggleLight = (room: string): ToggleLight => ({
  type: 'toggle-light',
  room,
})

export const SetHourT = t.type({
  type: t.literal('set-hour'),
  date: tt.DateFromISOString,
})

export type SetHour = t.TypeOf<typeof SetHourT>
export const SetHour = (date: Date): SetHour => ({ type: 'set-hour', date })

export const MsgT = t.union([
  SetOccupancyT,
  SetHourT,
  SetLightOnT,
  ToggleLightT,
])
export type Msg = t.TypeOf<typeof MsgT>
