import { Command, CmdNone } from '../src/commands'
import { match } from 'ts-pattern'
import * as immutable from 'object-path-immutable'

import {
  isHourLate,
  isKidWeek,
  Model,
  RoomKey,
  roomKeys,
  sunProgress,
} from './Model'
import {
  Msg,
  SetOccupancy,
  SetHour,
  SetLightOn,
  ToggleLight,
  LightState,
  LightStates,
  SetSensorRaw,
  SetZigbeeEvent,
  SetScene,
  PushEvent as PushEventMake,
  Compose,
  DeskCommand,
  ToggleRoomScene,
} from './Msg'
import type {PushEvent} from './Msg'

/*
 * update
 */
export const update = (model: Model, msg: Msg): [Model, Command<Msg>] =>
  match<Msg, [Model, Command<Msg>]>(msg)
    .with({ type: 'leave-house' }, () => [leaveHouse(model), CmdNone])
    .with({ type: 'house-bedtime' }, () => [bedtime(model), CmdNone])
    .with({ type: 'doorbell-trigger' }, () => [doorbellTrigger(model), CmdNone])
    .with({ type: 'doorbell-cancel' }, () => [doorbellCancel(model), CmdNone])
    .with({ type: 'toggle-room-scene' }, (msg) => [toggleRoomScene(model, msg), CmdNone])
    .with({ type: 'set-value' }, ({ key, value }) => [
      setValue(model, key, value),
      CmdNone,
    ])
    .with({ type: 'set-values' }, ({ keyValues }) => [
      setValues(model, keyValues),
      CmdNone,
    ])
    .with({ type: 'clear-value' }, ({ key }) => [
      setValue(model, key, undefined),
      CmdNone,
    ])
    .with({ type: 'set-set' }, ({ key, value, clear }) => [
      setSetSet(model, key, value, clear),
      CmdNone,
    ])
    .with({ type: 'toggle-bool' }, ({ key }) => [
      toggleBool(model, key),
      CmdNone,
    ])
    .with({ type: 'set-occupancy' }, (msg) => [
      updateOccupancy(model, msg),
      CmdNone,
    ])
    .with({ type: 'set-scene' }, (msg) => [updateScene(model, msg), CmdNone])
    .with({ type: 'set-sensor-raw' }, (msg) => [
      updateSensorRaw(model, msg),
      CmdNone,
    ])
    .with({ type: 'push-event' }, (msg) => [pushEvent(model, msg), CmdNone])
    .with({ type: 'set-hour' }, (msg) => [updateModelDate(model, msg), CmdNone])
    .with({ type: 'set-light-on' }, (msg) => [
      updateLightOn(model, msg),
      CmdNone,
    ])
    .with({ type: 'set-zigbee-event' }, (msg) => [
      updateZigbeeEvent(model, msg),
      CmdNone,
    ])
    .with({ type: 'toggle-light' }, (msg) => [toggleLight(model, msg), CmdNone])
    .with({ type: 'clear-room-scenes' }, () => [
      clearRoomScenes(model),
      CmdNone,
    ])
    .with({ type: 'compose' }, (msg) => composeUpdate(model, msg))
    .with({ type: 'desk-cmd' }, (msg) => [deskCommand(model, msg), CmdNone])
    .exhaustive()


const deskCommand = (
  model: Model,
  {room, command}: DeskCommand,
): Model =>
    immutable.set(model, ['rooms', room, 'desk', 'command'], command)


const composeUpdate = (
  model: Model,
  { msgs }: Compose,
): [Model, Command<Msg>] =>
  msgs.reduce(
    ([model, cmd], msg) => {
      const [nextModel] = update(model, msg)
      return [nextModel, cmd]
    },
    [model, CmdNone],
  )

/*
 * leaving the house - turn all the lights off
 */
const leaveHouse = (model: Model): Model => {
  return roomKeys.reduce((model: Model, roomKey: RoomKey) => {
    return immutable.set(model, ['rooms', roomKey, 'scene'], 'off')
  }, model)
}

/*
 * it's bedtime!
 * Let's light up the house to assist me getting ready for beddie byes!
 * - turn on the bedroom lights
 * - dim the backroom lights
 * - if it's a non-kid week, dim the playroom lights
 */
const bedtime = (model: Model): Model => {
  // switch all rooms off
  let newModel = roomKeys.reduce((model: Model, roomKey: RoomKey) => {
    return immutable.set(model, ['rooms', roomKey, 'scene'], 'off')
  }, model)

  // but switch some stuff on to help get ready for beddy
  newModel = immutable.set(newModel, 'rooms.backroom.scene', 'dim')
  newModel = immutable.set(newModel, 'rooms.bedroom.scene', 'bright')
  if (!model.kidweek) {
    newModel = immutable.set(newModel, 'rooms.playroom.scene', 'dim')
  }

  return newModel
}

// msgs.reduce(([model,cmd],msg) => {
//   const [nextModel,nextCmd] = update(model,msg)
//   return [nextModel,nextCmd]

// }, [model, CmdNone]: [Model, Command<Msg>])

const setValues = (model: Model, kvs: readonly [Path, unknown][]): Model =>
  kvs.reduce((model, [key, value]) => setValue(model, key, value), model)

const setValue = (model: Model, key: Path, value: unknown): Model => {
  if (value === undefined) {
    return immutable.del(model, key)
  } else {
    return immutable.set(model, key, value)
  }
}

const immutableSetSet = <T extends Record<string, unknown>>(
  model: T,
  key: string,
  value: string,
  clear = false,
): T => {
  const valSet = new Set(immutable.get(model, key))
  if (clear) {
    valSet.delete(value)
  } else {
    valSet.add(value)
  }
  console.log('valSet after', valSet)
  return immutable.set(model, key, [...valSet])
}
const setSetSet = (
  model: Model,
  key: string,
  value: string,
  clear: boolean,
): Model => immutableSetSet(model, key, value, clear)

const toggleBool = (model: Model, key: Path): Model => {
  const value = immutable.get(model, key, false)
  return immutable.set(model, key, !value)
}

const doorbellTrigger = (model: Model): Model => pushEvent(model, PushEventMake('doorbellEvents', 'triggered')())
const doorbellCancel = (model: Model): Model => pushEvent(model, PushEventMake('doorbellEvents', 'cancelled')())

const pushEvent = (model: Model, { event, at, path }: PushEvent): Model =>
  immutable.push(model, path, [at, event])

const updateOccupancy = (
  model: Model,
  { room, occupied }: SetOccupancy,
): Model => immutable.set(model, ['rooms', room, 'occupied'], occupied)

const toggleRoomScene = (model: Model, { room }: ToggleRoomScene): Model => {
  const scene = immutable.get(model, ['rooms', room, 'scene'])

  let nextScene
  if(scene === 'off') {
    nextScene = 'on'
  } else {
    nextScene = 'off'
  }

  return immutable.set(model, ['rooms', room, 'scene'], nextScene)
}

const updateScene = (model: Model, { room, scene }: SetScene): Model =>
  immutable.set(model, ['rooms', room, 'scene'], scene)

const updateSensorRaw = (
  model: Model,
  { room, readings }: SetSensorRaw,
): Model => immutable.merge(model, ['rooms', room, 'sensors'], readings)

const updateZigbeeEvent = (
  model: Model,
  { key, data }: SetZigbeeEvent,
): Model => {
  const parts = key.split('/')
  const [, room, device] = parts
  return immutable.set(model, ['rooms', room, 'sensors', device], data)
}

const updateLightOn = (model: Model, { room, lightOn }: SetLightOn): Model =>
  immutable.set(model, ['rooms', room, 'lightOn'], lightOn)

const nextLightState = (s: LightState): LightState => {
  const i = LightStates.indexOf(s)
  return LightStates[(i + 1) % LightStates.length]
}
const toggleLight = (model: Model, { room }: ToggleLight): Model =>
  immutable.update(model, ['rooms', room, 'lightOn'], nextLightState)

const clearRoomScenes = (model: Model): Model =>
  Object.keys(model.rooms).reduce(
    (rooms, roomKey) =>
      immutable.set(rooms, ['rooms', roomKey, 'scene'], undefined),
    model,
  )

const updateModelDate = (model: Model, { date }: SetHour): Model => {
  const sunProg = sunProgress(date)
  const [prog, dayNight] = sunProg
  const daylightProgress = dayNight === 'day' ? prog : 1.0

  return immutable.assign(model, undefined, {
    kidweek: isKidWeek(date),
    hour: date.getHours(),
    hourLate: isHourLate(date),
    date: date,
    sunProgress: sunProg,
    daylightProgress,
  })
}
