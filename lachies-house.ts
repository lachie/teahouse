process.env.TZ = 'Australia/Sydney'

import { match } from 'ts-pattern'
import { differenceInCalendarDays } from 'date-fns'
import * as immutable from 'object-path-immutable'

import { Command, CmdNone } from './commands'
import { Container, Room } from './house'

import { PersonDetector, RFLight, Metrics } from './devices'

import { runtime } from './runtime'
import { Sub } from './runtime/subscriptions'
import { Cron } from './effects/cron'

import * as mqtt from 'async-mqtt'
import { InfluxDB } from '@influxdata/influxdb-client'

import HttpInterfaceFactory from './interfaces/http'
import websocketInterface from './interfaces/websocket'

import secrets from './secrets.json'

import { Model, PlayroomModel } from './lachies-house/Model'
import {
  Msg,
  SetOccupancy,
  SetHour,
  MsgT,
  SetLightOn,
  ToggleLight,
  LightState,
  LightStates,
  LightStateT,
} from './lachies-house/Msg'
import { InterfaceFactory } from './interfaces'
import WebsocketInterfaceFactory from './interfaces/websocket'

const initialDate = new Date()
let initialModel: Model = {
  date: initialDate,
  hour: initialDate.getHours(),
  hourLate: isHourLate(initialDate),
  kidweek: isKidWeek(initialDate),
  rooms: {
    playroom: {
      occupied: false,
      lightOn: 'detect',
    },
  },
}

/*
 * update
 */
const update = (model: Model, msg: Msg): [Model, Command<Msg>] =>
  match<Msg, [Model, Command<Msg>]>(msg)
    .with({ type: 'set-occupancy' }, (msg) => [
      updateOccupancy(model, msg),
      CmdNone,
    ])
    .with({ type: 'set-hour' }, (msg) => [updateModelDate(model, msg), CmdNone])
    .with({ type: 'set-light-on' }, (msg) => [
      updateLightOn(model, msg),
      CmdNone,
    ])
    .with({ type: 'toggle-light' }, (msg) => [toggleLight(model, msg), CmdNone])
    .exhaustive()

const updateOccupancy = (
  model: Model,
  { room, occupied }: SetOccupancy,
): Model => immutable.set(model, ['rooms', room, 'occupied'], occupied)

const updateLightOn = (model: Model, { room, lightOn }: SetLightOn): Model =>
  immutable.set(model, ['rooms', room, 'lightOn'], lightOn)

const nextLightState = (s: LightState): LightState => {
  const i = LightStates.indexOf(s)
  return LightStates[(i + 1) % LightStates.length]
}
const toggleLight = (model: Model, { room }: ToggleLight): Model =>
  immutable.update(model, ['rooms', room, 'lightOn'], nextLightState)

// I've got my kids every other fortnight, for a fortnight
function isKidWeek(date: Date): boolean {
  const kidWeekRef = new Date('2021-08-21')
  const delta = differenceInCalendarDays(date, kidWeekRef)
  const fortnight = Math.floor(delta / 14)

  return fortnight % 2 == 0
}

// Is it late?
function isHourLate(date: Date): boolean {
  const hour = date.getHours()
  return hour < 6 || isKidWeek(date) ? hour >= 21 : hour >= 23
}

const updateModelDate = (model: Model, { date }: SetHour): Model =>
  immutable.assign(model, undefined, {
    kidweek: isKidWeek(date),
    hour: date.getHours(),
    hourLate: isHourLate(date),
    date: date,
  })

/*
 * subscriptions
 */
const subscriptions = (_model: Model): Sub<Msg> =>
  Sub(Cron('0 * * * * *', SetHour))

/*
 * house
 */
const house = (model: Model): Container<Msg> => ({
  type: 'house',
  key: 'house',
  children: [playroom(model.rooms['playroom'], model)],
})

const shortDelay = 60 * 1000
const defaultDelay = 10 * 60 * 1000

const playroom = (
  room: PlayroomModel,
  { kidweek, hour, hourLate }: Model,
): Container<Msg> => {
  const { occupied, lightOn } = room

  let switchLightOn = false
  switch (lightOn) {
    case 'on':
      switchLightOn = true
      break
    case 'off':
      switchLightOn = false
      break
    case 'detect':
      switchLightOn = occupied
      // when the kids are home and its late, force the light off
      if (kidweek && hour >= 21) {
        switchLightOn = false
      }
  }

  // default off time is 10 minutes
  let offDelay = defaultDelay
  // when its late, decrease off delay to 1 minute
  if (hourLate) {
    offDelay = shortDelay
  }

  return Room(
    'playroom',
    Metrics.make('occupied', { room: 'playroom' }, [
      'occupied',
      occupied ? 1 : 0,
    ]),
    RFLight.make('lights', 'lightbringer/playroom/light', switchLightOn),
    PersonDetector.make(
      'detector',
      'lightbringer/playroom/occupied',
      SetOccupancy('playroom'),
      offDelay,
    ),
  )
}

/*
 * runtime
 */
const mqttClient = mqtt.connect(secrets.mqtt.broker, {
  username: secrets.mqtt.username,
  password: secrets.mqtt.password,
})

const influxClient = new InfluxDB({
  url: secrets.influx.url,
  token: secrets.influx.token,
}).getWriteApi(secrets.influx.org, secrets.influx.bucket)

const interfaces: InterfaceFactory<Msg, Model>[] = [
  new HttpInterfaceFactory(MsgT, 3030),
  // new WebsocketInterfaceFactory(MsgT, 3031),
]

runtime(
  {
    update,
    house,
    subscriptions,
    initialModel,
  },
  { mqttClient, influxClient, interfaces },
)
