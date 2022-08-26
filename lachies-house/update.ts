import { Command, CmdNone } from '../commands'
import { match } from 'ts-pattern'
import * as immutable from 'object-path-immutable'

import { isHourLate, isKidWeek, Model, sunProgress } from './Model'
import {
  Msg,
  SetOccupancy,
  SetHour,
  MsgT,
  SetLightOn,
  ToggleLight,
  LightState,
  LightStates,
  SetSensorRaw,
  SetZigbeeEvent,
  SetScene,
  PushEvent,
} from './Msg'

/*
 * update
 */
export const update = (model: Model, msg: Msg): [Model, Command<Msg>] =>
  match<Msg, [Model, Command<Msg>]>(msg)
    .with({ type: 'set-value' }, ({key,value}) => [
      setValue(model, key, value),
      CmdNone,
    ])
    .with({ type: 'set-values' }, ({keyValues}) => [
      setValues(model, keyValues),
      CmdNone,
    ])
    .with({ type: 'clear-value' }, ({key}) => [
      setValue(model, key, undefined),
      CmdNone,
    ])
    .with({ type: 'toggle-bool' }, ({key}) => [
      toggleBool(model, key),
      CmdNone,
    ])
    .with({ type: 'set-occupancy' }, (msg) => [
      updateOccupancy(model, msg),
      CmdNone,
    ])
    .with({ type: 'set-scene' }, (msg) => [
      updateScene(model, msg),
      CmdNone,
    ])
    .with({ type: 'set-sensor-raw' }, (msg) => [
      updateSensorRaw(model, msg),
      CmdNone,
    ])
    .with({type: 'push-event'}, (msg) => [pushEvent(model, msg), CmdNone])
    .with({ type: 'set-hour' }, (msg) => [updateModelDate(model, msg), CmdNone])
    .with({ type: 'set-light-on' }, (msg) => [
      updateLightOn(model, msg),
      CmdNone,
    ])
    .with({type: 'set-zigbee-event'}, (msg) => [updateZigbeeEvent(model, msg), CmdNone])
    .with({ type: 'toggle-light' }, (msg) => [toggleLight(model, msg), CmdNone])
    .exhaustive()

const setValues = (model: Model, kvs: readonly [Path,unknown][]): Model => kvs.reduce((model,[key,value]) => setValue(model,key,value), model)

const setValue = (model: Model, key: Path, value: unknown): Model => {
  if(value === undefined) {
    return immutable.del(model, key)
  } else {
    return immutable.set(model, key, value)
  }
}

const toggleBool = (model: Model, key: Path): Model => {
  const value = immutable.get(model, key, false)
  return immutable.set(model, key, !value)
}

const pushEvent = (model: Model, {event, at, path}: PushEvent): Model => immutable.push(model, path, [at,event])

const updateOccupancy = (
  model: Model,
  { room, occupied }: SetOccupancy,
): Model => immutable.set(model, ['rooms', room, 'occupied'], occupied)

const updateScene = (
  model: Model,
  { room, scene }: SetScene,
): Model => immutable.set(model, ['rooms', room, 'scene'], scene)

const updateSensorRaw = (
  model: Model,
  { room, readings }: SetSensorRaw,
): Model => immutable.merge(model, ['rooms', room, 'sensors'], readings)

const updateZigbeeEvent = (
  model: Model,
  { key, data }: SetZigbeeEvent,
): Model => {
  const parts = key.split('/')
  const [,room,device] = parts
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


const updateModelDate = (model: Model, { date }: SetHour): Model => {
  const sunProg = sunProgress(date)
  const [prog, dayNight] = sunProg
  const daylightProgress = (dayNight === 'day') ? prog : 1.0

  return immutable.assign(model, undefined, {
    kidweek: isKidWeek(date),
    hour: date.getHours(),
    hourLate: isHourLate(date),
    date: date,
    sunProgress: sunProg,
    daylightProgress,
  })}