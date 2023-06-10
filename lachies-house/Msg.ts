import * as z from 'zod'

/*
 * message
 */

export const LeaveHouseT = z.object({
  type: z.literal('leave-house'),
})
export type LeaveHouse = z.infer<typeof LeaveHouseT>
export const LeaveHouse = (): LeaveHouse => ({ type: 'leave-house' })

export const BedtimeT = z.object({
  type: z.literal('house-bedtime'),
})
export type Bedtime = z.infer<typeof BedtimeT>
export const Bedtime = (): Bedtime => ({ type: 'house-bedtime' })

export const DoorbellTriggerT = z.object({
  type: z.literal('doorbell-trigger'),
})
export type DoorbellTrigger = z.infer<typeof DoorbellTriggerT>
export const DoorbellTrigger = (): DoorbellTrigger => ({ type: 'doorbell-trigger' })

export const DoorbellCancelT = z.object({
  type: z.literal('doorbell-cancel'),
})
export type DoorbellCancel = z.infer<typeof DoorbellCancelT>
export const DoorbellCancel = (): DoorbellCancel => ({ type: 'doorbell-cancel' })

export const ToggleRoomSceneT = z.object({
  type: z.literal('toggle-room-scene'),
  room: z.string(),
})
export type ToggleRoomScene = z.infer<typeof ToggleRoomSceneT>
export const ToggleRoomScene = (room: string) => (): ToggleRoomScene => ({ type: 'toggle-room-scene', room })


export const SetOccupancyT = z.object({
  type: z.literal('set-occupancy'),
  room: z.string(),
  occupied: z.boolean(),
})

export type SetOccupancy = z.infer<typeof SetOccupancyT>
// type SetOccupancy = { type: 'set-occupancy'; room: string; occupied: boolean }
export const SetOccupancy =
  (room: string) =>
    (occupied: boolean): SetOccupancy => ({
      type: 'set-occupancy',
      room,
      occupied,
    })

// SetScene
export const SetRoomSceneT = z.object({
  type: z.literal('set-scene'),
  room: z.string(),
  scene: z.string().optional(),
})

export type SetRoomScene = z.infer<typeof SetRoomSceneT>
export const SetRoomScene = (room: string, scene: string | undefined) => (): SetRoomScene => ({
  type: 'set-scene',
  room,
  scene,
})

export const SetRoomSceneMap =
  (room: string, tagScene: (action: string) => string | undefined = (x) => x) =>
    (action: string): SetRoomScene => ({
      type: 'set-scene',
      room,
      scene: tagScene(action),
    })

// SetPresence
// export const SetDataT = z.object({
//   type: t.literal('set-data'),
//   room: t.string,
//   data: t.UnknownRecord
// })

// export type SetData = z.infer<typeof SetDataT>
// export const SetData =
//   (room: string) =>
//   (data: Record<string,unknown>): SetData => ({
//     type: 'set-data',
//     room,
//     data
// })

export const SensorReadingT = z.union([z.string(), z.number(), z.boolean()])
export type SensorReading = z.infer<typeof SensorReadingT>

export const SetSensorRawT = z.object({
  type: z.literal('set-sensor-raw'),
  room: z.string(),
  readings: z.record(z.unknown()),
})
export type SetSensorRaw = z.infer<typeof SetSensorRawT>
export const SetSensorRaw =
  (room: string) =>
    (readings: Record<string, unknown>): SetSensorRaw => ({
      type: 'set-sensor-raw',
      room,
      readings,
    })

const ImmutablePath = z.union([
  z.string(),
  z.array(z.union([z.string(), z.number()])),
])
type ImmutablePath = z.infer<typeof ImmutablePath>
// type Path = string | ReadonlyArray<number | string>;

export const SetValueT = z.object({
  type: z.literal('set-value'),
  key: ImmutablePath,
  value: z.unknown(),
})
export type SetValue = z.infer<typeof SetValueT>
export const SetValue =
  (key: ImmutablePath) =>
    (value: unknown): SetValue => ({ type: 'set-value', key, value })
export const SetConst =
  (key: ImmutablePath, value: unknown) =>
    (..._: unknown[]): SetValue => ({ type: 'set-value', key, value })

const zip = <A, B>(as: A[], bs: B[]): [A, B][] => as.map((a, i) => [a, bs[i]])

export const SetValuesT = z.object({
  type: z.literal('set-values'),
  keyValues: z.array(z.tuple([ImmutablePath, z.unknown()])),
})
export type SetValues = z.infer<typeof SetValuesT>
export const SetValues =
  (keys: ImmutablePath[]) =>
    (values: unknown[]): SetValues => ({
      type: 'set-values',
      keyValues: zip(keys, values),
    })
export const SetConsts =
  (keyValues: [ImmutablePath, unknown][]) =>
    (..._: unknown[]): SetValues => ({ type: 'set-values', keyValues })

// sets
export const SetSetT = z.object({
  type: z.literal('set-set'),
  key: z.string(),
  value: z.string(),
  clear: z.boolean(),
})
export type SetSet = z.infer<typeof SetSetT>
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

export const ClearValueT = z.object({
  type: z.literal('clear-value'),
  key: ImmutablePath,
})
export type ClearValue = z.infer<typeof ClearValueT>
export const ClearValue = (key: ImmutablePath): ClearValue => ({
  type: 'clear-value',
  key,
})

export const PushEventT = z.object({
  type: z.literal('push-event'),
  path: ImmutablePath,
  event: z.string(),
  at: z.coerce.date(),
})
export type PushEvent = z.infer<typeof PushEventT>
export const PushEvent = (path: ImmutablePath, event: string) => (): PushEvent => ({
  type: 'push-event',
  path,
  event,
  at: new Date(),
})

export const ToggleBoolT = z.object({
  type: z.literal('toggle-bool'),
  key: z.string(),
})
export type ToggleBool = z.infer<typeof ToggleBoolT>
export const ToggleBool = (key: string) => (): ToggleBool => ({
  type: 'toggle-bool',
  key,
})

export const LightStateT = z.enum(['on', 'off', 'detect'])
export type LightState = z.infer<typeof LightStateT>
export const LightStates: LightState[] = ['on', 'off', 'detect']

export const SetLightOnT = z.object({
  type: z.literal('set-light-on'),
  room: z.string(),
  lightOn: LightStateT,
})
export type SetLightOn = z.infer<typeof SetLightOnT>
export const SetLightOn =
  (room: string) =>
    (lightOn: LightState): SetLightOn => ({
      type: 'set-light-on',
      room,
      lightOn,
    })

export const ToggleLightT = z.object({
  type: z.literal('toggle-light'),
  room: z.string(),
})
export type ToggleLight = z.infer<typeof ToggleLightT>
export const ToggleLight = (room: string): ToggleLight => ({
  type: 'toggle-light',
  room,
})

export const SetHourT = z.object({
  type: z.literal('set-hour'),
  date: z.coerce.date(),
})

export type SetHour = z.infer<typeof SetHourT>
export const SetHour = (date: Date): SetHour => ({ type: 'set-hour', date })

export const SetZigbeeEventT = z.object({
  type: z.literal('set-zigbee-event'),
  key: z.string(),
  data: z.record(z.unknown()),
})

export type SetZigbeeEvent = z.infer<typeof SetZigbeeEventT>
export const SetZigbeeEvent = (
  key: string,
  data: Record<string, unknown>,
): SetZigbeeEvent => ({ type: 'set-zigbee-event', key, data })

// helpers

export const ClearRoomScenesT = z.object({ type: z.literal('clear-room-scenes') })
export type ClearRoomScenes = z.infer<typeof ClearRoomScenesT>
export const ClearRoomScenes = (): ClearRoomScenes => ({
  type: 'clear-room-scenes',
})

// DeskCommand
export const DeskCommandT = z.object({
  type: z.literal('desk-cmd'),
  room: z.string(),
  command: z.union([z.enum(['up', 'down', 'idle']), z.undefined()]),
})

export type DeskCommand = z.infer<typeof DeskCommandT>
export const DeskCommand =
  (room: string, command: DeskCommand['command']): DeskCommand =>
  ({
    type: 'desk-cmd',
    room,
    command,
  })

export const SetHouseScene = SetValue('houseScene')

const MsgRawT = z.union([
  LeaveHouseT,
  BedtimeT,
  DoorbellTriggerT,
  DoorbellCancelT,
  ToggleRoomSceneT,
  SetRoomSceneT,
  SetValueT,
  SetValuesT,
  SetSetT,
  ClearValueT,
  PushEventT,
  ToggleBoolT,
  SetOccupancyT,
  SetSensorRawT,
  SetHourT,
  // SetDataT,
  SetLightOnT,
  SetZigbeeEventT,
  ToggleLightT,
  ClearRoomScenesT,
  DeskCommandT,
])
type MsgRaw = z.infer<typeof MsgRawT>

const ComposeT = z.object({ type: z.literal('compose'), msgs: z.array(MsgRawT) })
export const Compose = (msgs: MsgRaw[]) => ({ type: 'compose', msgs })
export type Compose = z.infer<typeof ComposeT>

export const MsgT = z.union([MsgRawT, ComposeT])
export type Msg = z.infer<typeof MsgT>
