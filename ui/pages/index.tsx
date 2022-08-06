import type { NextPage } from 'next'
import { Model, ModelT, RoomModel } from '../lib/Model'
import { ClearValue, LightState, SetConst, SensorReading, SetLightOn, SetScene, ToggleLight } from '../lib/Msg'
import { useDispatchMsgTagger } from '../lib/useDispatchMsg'
import classNames from 'classnames'
import {
  LightBulbIcon,
  UserIcon,
  SunIcon,
  XCircleIcon,
  MoonIcon,
  BellIcon,
} from '@heroicons/react/outline'
import {
  BellIcon as SolidBellIcon,
} from '@heroicons/react/solid'
import { LightBulbOffIcon } from '../lib/LightBulbOffIcon'
import { useModelUpdates } from '../lib/useModelUpdates'
import { ReactElement, ReactNode } from 'react'
import { Popover } from '@headlessui/react'

import format from 'date-fns/format'


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
  name: string
  Action?: ReactElement
}
const RoomLine = ({ Icon, MiniSlot, name, Action }: RoomLineProps): ReactElement =>
  <div className="text-gray-600 flex flex-row justify-start py-6 min-w-full place-content-center">
    <div className="flex flex-row py-2 place-content-center">
      <div className="h-8 w-8 float-left mt-0.5 mr-3 ">
        {Icon}
      </div>
      <div className="w-16">
        {MiniSlot}
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

type FrontdoorProps = { model: Model }
const Frontdoor = ({ model: { doorbell } }: FrontdoorProps) => {
  const clearDoorbell = useDispatchMsgTagger(SetConst('doorbell', false))
  const Icon = doorbell ? <BellIcon className='h-8 w-8 text-red-500' /> : <BellIcon className='h-8 w-8 text-gray-400' />
  const Action = <button className={classNames(" rounded py-2 px-4 w-full flex flex-row content-center", { 'bg-gray-200': doorbell, 'border border-gray-400': !doorbell })} onClick={clearDoorbell}>{Icon}</button>
  return <RoomLine name="frontdoor" Icon={Icon} Action={Action} />
}

type ModelProps = { model: Model }

const Rooms = ({ model }: ModelProps) => {
  return (
    <>
      <Frontdoor model={model} />
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
    <div className="bg-blue-300 min-h-screen md:pt-16">
      <div className="container mx-auto md:max-w-2xl md:shadow-lg md:rounded-xl">
        <header className="bg-purple-600 md:rounded-t-xl mx-auto h-16 md:h-32">
          <section className="flex items-center justify-center min-h-full">
            <div className=" text-center text-white text-3xl font-semibold">
              Teahouse
            </div>
          </section>
        </header>

        <section className="mx-auto bg-white">
          <ModelUpdater render={model => <>
            <DayProgress model={model} />
            <Rooms model={model} />
          </>} />
        </section>
        <footer className="bg-purple-400 md:rounded-b-xl mx-auto h-8"></footer>
      </div>
    </div>
  )
}

export default Home
