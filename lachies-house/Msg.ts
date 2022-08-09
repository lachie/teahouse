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

// SetScene
export const SetSceneT = t.type({
  type: t.literal('set-scene'),
  room: t.string,
  scene: t.union([t.string,t.undefined]),
})

export type SetScene = t.TypeOf<typeof SetSceneT>
export const SetScene =
  (room: string, tagScene: (action: string) => string | undefined = (x) => x) =>
  (action: string): SetScene => ({
    type: 'set-scene',
    room,
    scene: tagScene(action),
  })

// SetPresence
// export const SetDataT = t.type({
//   type: t.literal('set-data'),
//   room: t.string,
//   data: t.UnknownRecord
// })

// export type SetData = t.TypeOf<typeof SetDataT>
// export const SetData =
//   (room: string) =>
//   (data: Record<string,unknown>): SetData => ({
//     type: 'set-data',
//     room,
//     data
  // })

export const SensorReadingT = t.union([t.string, t.number, t.boolean])
export type SensorReading = t.TypeOf<typeof SensorReadingT>

export const SetSensorRawT = t.type({
  type: t.literal('set-sensor-raw'),
  room: t.string,
  readings: t.UnknownRecord,
})
export type SetSensorRaw = t.TypeOf<typeof SetSensorRawT>
export const SetSensorRaw =
  (room: string) =>
  (readings: Record<string, unknown>): SetSensorRaw => ({
    type: 'set-sensor-raw',
    room,
    readings,
  })

const ImmutablePath = t.union([t.string, t.readonlyArray(t.union([t.string, t.number]))])
// type Path = string | ReadonlyArray<number | string>;

export const SetValueT = t.type({type: t.literal('set-value'), key: ImmutablePath, value: t.unknown})
export type SetValue = t.TypeOf<typeof SetValueT>
export const SetValue = (key: Path) => (value: unknown): SetValue => ({type: 'set-value', key, value})
export const SetConst = (key: Path, value: unknown) => (..._: unknown[]): SetValue => ({type: 'set-value', key, value})

const zip = <A,B>(as: A[], bs: B[]): [A,B][] => as.map((a,i) => [a,bs[i]])
export const SetValuesT = t.type({type: t.literal('set-values'), keyValues: t.readonlyArray(t.tuple([ImmutablePath, t.unknown]))})
export type SetValues = t.TypeOf<typeof SetValuesT>
export const SetValues = (keys: Path[]) => (values: unknown[]): SetValues => ({type: 'set-values', keyValues: zip(keys,values)})
export const SetConsts = (keyValues: [Path,unknown][]) => (..._: unknown[]): SetValues => ({type: 'set-values', keyValues})

export const ClearValueT = t.type({type: t.literal('clear-value'), key: ImmutablePath})
export type ClearValue = t.TypeOf<typeof ClearValueT>
export const ClearValue = (key: Path): ClearValue => ({type: 'clear-value', key})


export const ToggleBoolT = t.type({type: t.literal('toggle-bool'), key: t.string})
export type ToggleBool = t.TypeOf<typeof ToggleBoolT>
export const ToggleBool = (key: string) => (): ToggleBool => ({type: 'toggle-bool', key})

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

export const SetZigbeeEventT = t.type({
  type: t.literal('set-zigbee-event'),
  key: t.string,
  data: t.UnknownRecord
})

export type SetZigbeeEvent = t.TypeOf<typeof SetZigbeeEventT>
export const SetZigbeeEvent = (key: string, data: Record<string,unknown>): SetZigbeeEvent => ({ type: 'set-zigbee-event', key, data })

export const MsgT = t.union([
  SetValueT,
  SetValuesT,
  ClearValueT,
  ToggleBoolT,
  SetOccupancyT,
  SetSceneT,
  SetSensorRawT,
  SetHourT,
  // SetDataT,
  SetLightOnT,
  SetZigbeeEventT,
  ToggleLightT,
])
export type Msg = t.TypeOf<typeof MsgT>
