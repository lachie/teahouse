process.env.TZ = 'Australia/Sydney'

import * as mqtt from 'async-mqtt'
import { match } from 'ts-pattern'
import { differenceInCalendarDays } from 'date-fns'
import * as immutable from 'object-path-immutable'

import { Command, CmdNone } from './commands'
import { runtime } from './runtime'
import { Container, Room } from './house'
import { PersonDetector, RFLight } from './devices'
import { Sub } from './subscriptions'
import { Cron } from './cron'
import secrets from './secrets.json'

/*
 * message
 */
type Msg = SetOccupancy | SetHour

type SetOccupancy = { type: 'set-occupancy'; room: string; occupied: boolean }
const SetOccupancy =
  (room: string) =>
  (occupied: boolean): SetOccupancy => ({
    type: 'set-occupancy',
    room,
    occupied,
  })

type SetHour = { type: 'set-hour'; date: Date }
const SetHour = (date: Date): SetHour => ({ type: 'set-hour', date })


/*
 * model
 */
type Model = {
  rooms: {
    playroom: PlayroomModel
  }
  date: Date
  hour: number
  hourLate: boolean
  kidweek: boolean
}

type PlayroomModel = {
  occupied: boolean
  lightOn: boolean
}

type RoomId = keyof Model['rooms']

const initialDate = new Date()
let initialModel: Model = {
  date: initialDate,
  hour: initialDate.getHours(),
  hourLate: isHourLate(initialDate),
  kidweek: isKidWeek(initialDate),
  rooms: {
    playroom: {
      occupied: false,
      lightOn: false,
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
    .exhaustive()

const updateOccupancy = (
  model: Model,
  { room, occupied }: SetOccupancy,
): Model => immutable.set(model, ['rooms', room, 'occupied'], occupied)

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
    kidWeek: isKidWeek(date),
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

const playroom = (
  room: PlayroomModel,
  { kidweek, hour, hourLate }: Model,
): Container<Msg> => {
  // when the kids are home and its late, don't do anything
  if (kidweek && hour >= 21) {
    return Room('playroom', [])
  }

  // default off time is 10 minutes
  let offDelay = 10 * 60 * 1000
  // when its late, decrease off delay to 1 minute
  if (hourLate) {
    offDelay = 1 * 60 * 1000
  }

  return Room('playroom', [
    RFLight.make('lights', 'lightbringer/playroom/light', room.occupied),
    PersonDetector.make(
      'detector',
      'lightbringer/playroom/occupied',
      SetOccupancy('playroom'),
      offDelay,
    ),
  ])
}

/*
 * runtime
 */
const mqttClient = mqtt.connect(secrets.mqtt.broker, {
  username: secrets.mqtt.username,
  password: secrets.mqtt.password,
})

runtime(
  {
    update,
    house,
    subscriptions,
    initialModel,
  },
  { mqttClient },
)
