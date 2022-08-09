import type { NextPage } from 'next'
import { Model, ModelT, RoomModel } from '../lib/Model'
import { ClearValue, LightState, SetConsts, SensorReading, SetLightOn, SetScene, ToggleLight } from '../lib/Msg'
import { useDispatchMsgTagger } from '../lib/useDispatchMsg'
import classNames from 'classnames'
import {
  LightBulbIcon,
  UserIcon,
  SunIcon,
  XCircleIcon,
  MoonIcon,
  BellIcon,
  HomeIcon,
  CloudIcon,
} from '@heroicons/react/outline'
import {
  BellIcon as SolidBellIcon,
} from '@heroicons/react/solid'
import { LightBulbOffIcon } from '../lib/LightBulbOffIcon'
import { WiCloud, WiShowers } from 'react-icons/wi'
import { useModelUpdates } from '../lib/useModelUpdates'
import { Sound } from '../components/Sound'
import { ReactElement, ReactNode, useEffect } from 'react'
import { Popover } from '@headlessui/react'

import format from 'date-fns/format'
import useSWR from 'swr'
import { randomInt } from 'crypto'
import { match } from 'assert'
import { FullyKiosk, useFullyKiosk } from '../lib/useFullyKiosk'


const colours = {
  disabled: 'bg-gray-200 ring-gray-200',
  green: 'bg-green-500 ring-green-500',
  red: 'bg-red-500 ring-red-500',
  blue: 'bg-blue-500 ring-blue-500',
  amber: 'bg-amber-200 ring-amber-300',
  amberbright: 'bg-amber-300 ring-amber-200',
  sky: 'bg-sky-100 ring-sky-100',
}
type ColourKey = keyof typeof colours
const btn = 'py-2 px-4 text-white ring-opacity-50'

type IconComp = (p: { className: string }) => ReactElement
type SetSceneFn = (scene?: string) => Promise<void>

type SceneButtonProps = {
  currentScene?: string
  sceneSpec: SceneSpec
  setScene?: SetSceneFn,
}
const SceneButton = ({ sceneSpec: { scene, Icon, colour }, currentScene, setScene }: SceneButtonProps) => {
  const selected = scene === currentScene
  const className = `${btn} ${colours[colour || 'disabled']}`
  Icon ||= LightBulbIcon
  const onClick = setScene ? () => setScene(scene) : () => { }
  return (
    <button
      className={`${className} relative`}
      onClick={onClick}
      title={`Set scene to ${scene}`}
    >
      {selected && <div className="bg-white rounded-full w-2 h-2 absolute" style={{ left: '8px', top: '20px' }}></div>}
      <Icon className="h-8 w-8" />
    </button>
  )
}

type SceneSelectorProps = { scenes: SceneSpec[], scene: string | undefined, setScene: SetSceneFn }
const SceneSelector = ({ scenes, scene, setScene }: SceneSelectorProps) => {
  const currentScene = scenes.find(s => s.scene === scene) || scenes[0]
  return <Popover className="relative">
    <Popover.Button>
      <SceneButton
        sceneSpec={currentScene}
      />
    </Popover.Button>
    <Popover.Panel className="absolute z-10 p-4 bg-zinc-100 rounded-2xl shadow-xl" style={{ right: '0px' }}>
      {({ close }) => scenes.map(s =>
        <SceneButton
          sceneSpec={s}
          currentScene={scene}
          setScene={async () => { await setScene(s.scene); close() }}
        />
      )}
    </Popover.Panel>

  </Popover>
}

const symOr = (s: string) => (x?: unknown): string | null => x === undefined ? null : `${x}${s}`
const degSym = symOr('°')
const pcSym = symOr('%')

type TempReadings = { temperature: number, humidity: number }
type RoomTempProps = { readings: TempReadings }
const RoomTemp = ({ readings }: RoomTempProps): ReactElement => {
  console.log("readings", readings)
  return <div className="flex flex-col w-16 text-xs font-semibold text-gray-400">
    <div>{degSym(readings.temperature)}</div>
    <div>{pcSym(readings.humidity)}</div>
  </div>
}

type RoomLineProps = {
  Icon?: ReactNode
  MiniSlot?: ReactNode
  name: ReactNode
  Action?: ReactElement
}
const RoomLine = ({ Icon, MiniSlot, name, Action }: RoomLineProps): ReactElement =>
  <div className="text-gray-600 flex flex-row justify-start py-3 xl:py-6 min-w-full place-content-center">
    <div className="flex flex-row py-2 place-content-center">
      <div className="h-8 w-8 float-left mt-0.5 mr-3 ">
        {Icon}
      </div>
      <div className="w-16">
        {MiniSlot || ' '}
      </div>
      <span className="text-2xl text-gray-400 font-semibold">{name} </span>
    </div>
    <div className="flex flex-row flex-1 justify-end">
      <div className="w-16">
        {Action}
      </div>
    </div>
  </div>

type SceneModel = { scene?: string, sensors?: Record<string, SensorReading> }

type SceneSpec = {
  scene: string
  colour?: ColourKey
  Icon?: IconComp
}

type RoomProps<Model extends SceneModel> = {
  model: Model
  scenes: SceneSpec[]
  room: string
}
function Room<Model extends SceneModel>({ model, room, scenes }: RoomProps<Model>) {
  const setScene = useDispatchMsgTagger(SetScene(room))
  const occupied = true

  const occupiedIcon = `${occupied ? 'text-green-500' : 'text-gray-200'
    }`

  const Icon = <UserIcon className={occupiedIcon}></UserIcon>
  const MiniSlot = <RoomTemp readings={model.sensors as TempReadings} />
  const Menu = <SceneSelector scenes={scenes} scene={model.scene} setScene={setScene} />

  return <RoomLine Icon={Icon} MiniSlot={MiniSlot} name={room} Action={Menu} />

}

const officeScenes: SceneSpec[] = [
  { scene: 'off', Icon: XCircleIcon },
  { scene: 'morning', colour: 'amber' },
  { scene: 'morning2', colour: 'amber' },
  { scene: 'daylight', colour: 'amberbright' },
  { scene: 'purple' },
  { scene: 'blue' },
]
const Office = ({ model }: { model: RoomModel }) => <Room room="office" scenes={officeScenes} model={model} />

const backroomScenes: SceneSpec[] = [
  { scene: 'off', Icon: XCircleIcon },
  { scene: 'morning', colour: 'amber' },
  { scene: 'daylight', colour: 'amberbright' },
]
const Backroom = ({ model }: { model: RoomModel }) => <Room room="backroom" scenes={backroomScenes} model={model} />

const playroomScenes: SceneSpec[] = [
  { scene: 'off', Icon: XCircleIcon },
  { scene: 'morning', colour: 'amber' },
  { scene: 'daylight', colour: 'amberbright' },
]
const Playroom = ({ model }: { model: RoomModel }) => <Room room="playroom" scenes={playroomScenes} model={model} />


type FrontdoorProps = { model: Model, doorbell: boolean }
const Frontdoor = ({ doorbell }: FrontdoorProps) => {
  useFullyKiosk((fully: FullyKiosk) => {
    if (doorbell) {
      // fully.turnScreenOn()
      fully.stopScreensaver()
      // fully.setScreenBrightness(255)
      fully.showToast("door bell!")
    }
  }, [doorbell])
  const clearDoorbell = useDispatchMsgTagger(SetConsts([['doorbell', false], ['doorbellBlink', false]]))
  const Icon = doorbell ? <BellIcon className='h-8 w-8 text-red-500' /> : <BellIcon className='h-8 w-8 text-gray-400' />
  const Action = <button className={classNames(" rounded py-2 px-4 w-full flex flex-row content-center", { 'bg-gray-200': doorbell, 'border border-gray-400': !doorbell })} onClick={clearDoorbell}>{Icon}</button>

  return <>
    {doorbell && <Sound sound="doorbell-1" />}
    <RoomLine name="frontdoor" Icon={Icon} Action={Action} /></>
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());


type WeatherDay = {
  icon_descriptor: string
  rain: { chance: number, amount: { min: number, max: number } }
  temp_max: number
  temp_min: number
  short_text: string
  extended_text: string
  now: { temp_now: number }
}
type WeatherObservations = {
  temp: number
  temp_feels_like: number
  humidity: number
}
type WeatherProps = {}
const Weather = ({ }: WeatherProps): ReactElement => {
  const { data, error } = useSWR("/api/bom", fetcher)

  if (error) return <>Weather error {JSON.stringify(error)}</>
  if (!data) return <>Weather loading...</>

  const day = data.daily[0] as WeatherDay
  const obs = data.observations as WeatherObservations

  let Icon
  switch(day.icon_descriptor) {
    case 'shower':
      Icon = WiShowers
      break
      default:
        Icon = WiCloud
  }

  const summary = <div>
    {day.short_text}&nbsp;
    <span className="text-lg font-normal">
      [{day.rain.chance}%, {day.rain.amount.min}&mdash;{day.rain.amount.max}mm]
    </span>
  </div>

  const slot = <RoomTemp readings={{temperature: obs.temp, humidity: obs.humidity}} />
  //  size="32" color="rgb(156 163 175)"
  return <RoomLine Icon={Icon && <Icon className="h-8 w-8 text-gray-400"/>} MiniSlot={slot} name={summary} />
}

type ModelProps = { model: Model }

const Rooms = ({ model }: ModelProps) => {
  return (
    <>
      <Weather />
      <Frontdoor model={model} doorbell={model.doorbell} />
      <Backroom model={model.rooms.backroom}></Backroom>
      <Playroom model={model.rooms.playroom}></Playroom>
      <Office model={model.rooms.office}></Office>
    </>
  )
}

const DayProgress = ({ model }: ModelProps) => {
  const { sunProgress: [prog, dayNight] } = model

  const icon = dayNight === 'day' ? <SunIcon /> : <MoonIcon />
  const left = `${Math.round(prog * 100)}%`
  const timeS = format(model.date, 'kk:mm')

  return (
    <>
      <div className='w-full rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500'>
        <div className="px-4 w-full">
          <div className='relative h-8 w-8 -mx-4 text-white' style={{ left }}>{icon}</div>
        </div>
      </div>
      <div className='px-4 w-full'>
        <div className='relative h-8 w-8 -mx-4 text-s font-semibold text-gray-400 text-center' style={{ left }}>{timeS}</div>
      </div>
    </>
  )
}

type ModelUpdaterProps = {
  render: (m: Model) => ReactNode
}
const ModelUpdater = ({ render }: ModelUpdaterProps): ReactElement => {
  const { model, errors } = useModelUpdates(ModelT)

  console.log('m', model)
  console.log('e', errors)

  if (errors) return <b>oops: {JSON.stringify(errors)}</b>
  if (!model) return <div>loading...</div>

  const comp = render(model)

  return <>{comp ? comp : null}</>
}


const Home: NextPage = () => {
  return (
          <ModelUpdater render={model => <>
    <div className="bg-blue-300 min-h-screen 2xl:pt-16">
      <div className="container mx-auto max-w-full 2xl:max-w-2xl 2xl:shadow-lg 2xl:rounded-xl">
        <header className={classNames("2xl:rounded-t-xl mx-auto h-16 2xl:h-32", {"bg-purple-600": !model.doorbell, "bg-red-600": model.doorbell})}>
          <section className="flex items-center justify-center min-h-full">
            <div className="text-center text-white text-3xl font-semibold flex flex-row">
              T<HomeIcon className="w-8 h-8" />
            </div>
          </section>
        </header>

        <section className="mx-auto bg-white">
            <DayProgress model={model} />
            <Rooms model={model} />
        </section>
        <footer className="bg-purple-400 2xl:rounded-b-xl mx-auto h-8"></footer>
      </div>
    </div>
          </>} />
  )
}

export default Home
