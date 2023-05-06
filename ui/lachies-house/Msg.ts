import * as t from 'io-ts'
import * as tt from 'io-ts-types'

/*
 * message
 */

export const LeaveHouseT = t.type({
  type: t.literal('leave-house'),
})
export type LeaveHouse = t.TypeOf<typeof LeaveHouseT>
export const LeaveHouse = (): LeaveHouse => ({ type: 'leave-house' })

export const BedtimeT = t.type({
  type: t.literal('house-bedtime'),
})
export type Bedtime = t.TypeOf<typeof BedtimeT>
export const Bedtime = (): Bedtime => ({ type: 'house-bedtime' })

export const DoorbellTriggerT = t.type({
  type: t.literal('doorbell-trigger'),
})
export type DoorbellTrigger = t.TypeOf<typeof DoorbellTriggerT>
export const DoorbellTrigger = (): DoorbellTrigger => ({ type: 'doorbell-trigger' })

export const DoorbellCancelT = t.type({
  type: t.literal('doorbell-cancel'),
})
export type DoorbellCancel = t.TypeOf<typeof DoorbellCancelT>
export const DoorbellCancel = (): DoorbellCancel => ({ type: 'doorbell-cancel' })

export const ToggleRoomSceneT = t.type({
  type: t.literal('toggle-room-scene'),
  room: t.string,
})
export type ToggleRoomScene = t.TypeOf<typeof ToggleRoomSceneT>
export const ToggleRoomScene = (room: string) => (): ToggleRoomScene => ({ type: 'toggle-room-scene', room })


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
  scene: t.union([t.string, t.undefined]),
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

const ImmutablePath = t.union([
  t.string,
  t.readonlyArray(t.union([t.string, t.number])),
])
// type Path = string | ReadonlyArray<number | string>;

export const SetValueT = t.type({
  type: t.literal('set-value'),
  key: ImmutablePath,
  value: t.unknown,
})
export type SetValue = t.TypeOf<typeof SetValueT>
export const SetValue =
  (key: Path) =>
  (value: unknown): SetValue => ({ type: 'set-value', key, value })
export const SetConst =
  (key: Path, value: unknown) =>
  (..._: unknown[]): SetValue => ({ type: 'set-value', key, value })

const zip = <A, B>(as: A[], bs: B[]): [A, B][] => as.map((a, i) => [a, bs[i]])
export const SetValuesT = t.type({
  type: t.literal('set-values'),
  keyValues: t.readonlyArray(t.tuple([ImmutablePath, t.unknown])),
})
export type SetValues = t.TypeOf<typeof SetValuesT>
export const SetValues =
  (keys: Path[]) =>
  (values: unknown[]): SetValues => ({
    type: 'set-values',
    keyValues: zip(keys, values),
  })
export const SetConsts =
  (keyValues: [Path, unknown][]) =>
  (..._: unknown[]): SetValues => ({ type: 'set-values', keyValues })

// sets
export const SetSetT = t.type({
  type: t.literal('set-set'),
  key: t.string,
  value: t.string,
  clear: t.boolean,
})
export type SetSet = t.TypeOf<typeof SetSetT>
export const SetSetValue = (key: string, value: string) => (): SetSet => ({
  type: 'set-set',
  key,
  value,
  clear: false,
})
export const SetDelValue = (key: string, value: string) => (): SetSet => ({
  type: 'set-set',
  key,
  value,
  clear: true,
})

export const ClearValueT = t.type({
  type: t.literal('clear-value'),
  key: ImmutablePath,
})
export type ClearValue = t.TypeOf<typeof ClearValueT>
export const ClearValue = (key: Path): ClearValue => ({
  type: 'clear-value',
  key,
})

export const PushEventT = t.type({
  type: t.literal('push-event'),
  path: ImmutablePath,
  event: t.string,
  at: tt.DateFromISOString,
})
export type PushEvent = t.TypeOf<typeof PushEventT>
export const PushEvent = (path: Path, event: string) => (): PushEvent => ({
  type: 'push-event',
  path,
  event,
  at: new Date(),
})

export const ToggleBoolT = t.type({
  type: t.literal('toggle-bool'),
  key: t.string,
})
export type ToggleBool = t.TypeOf<typeof ToggleBoolT>
export const ToggleBool = (key: string) => (): ToggleBool => ({
  type: 'toggle-bool',
  key,
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

export const SetZigbeeEventT = t.type({
  type: t.literal('set-zigbee-event'),
  key: t.string,
  data: t.UnknownRecord,
})

export type SetZigbeeEvent = t.TypeOf<typeof SetZigbeeEventT>
export const SetZigbeeEvent = (
  key: string,
  data: Record<string, unknown>,
): SetZigbeeEvent => ({ type: 'set-zigbee-event', key, data })

// helpers

export const ClearRoomScenesT = t.type({ type: t.literal('clear-room-scenes') })
export type ClearRoomScenes = t.TypeOf<typeof ClearRoomScenesT>
export const ClearRoomScenes = (): ClearRoomScenes => ({
  type: 'clear-room-scenes',
})

// DeskCommand
export const DeskCommandT = t.type({
  type: t.literal('desk-cmd'),
  room: t.string,
  command: t.union([t.keyof({up: null, down: null, idle: null}), t.undefined]),
})

export type DeskCommand = t.TypeOf<typeof DeskCommandT>
export const DeskCommand =
  (room: string, command: DeskCommand['command']): DeskCommand =>
    ({type: 'desk-cmd',
    room,
    command,
  })

export const SetHouseScene = SetValue('houseScene')

const MsgRawT = t.union([
  LeaveHouseT,
  BedtimeT,
  DoorbellTriggerT,
  DoorbellCancelT,
  ToggleRoomSceneT,
  SetValueT,
  SetValuesT,
  SetSetT,
  ClearValueT,
  PushEventT,
  ToggleBoolT,
  SetOccupancyT,
  SetSceneT,
  SetSensorRawT,
  SetHourT,
  // SetDataT,
  SetLightOnT,
  SetZigbeeEventT,
  ToggleLightT,
  ClearRoomScenesT,
  DeskCommandT,
])
type MsgRaw = t.TypeOf<typeof MsgRawT>

const ComposeT = t.type({ type: t.literal('compose'), msgs: t.array(MsgRawT) })
export const Compose = (msgs: MsgRaw[]) => ({ type: 'compose', msgs })
export type Compose = t.TypeOf<typeof ComposeT>

export const MsgT = t.union([MsgRawT, ComposeT])
export type Msg = t.TypeOf<typeof MsgT>
