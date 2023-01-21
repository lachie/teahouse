import type { NextPage } from 'next'
import { Model, RoomModel, doorbellRinging } from '../lib/Model'
import {
  SensorReading,
  SetScene,
  PushEvent,
  LeaveHouse,
  Bedtime,
} from '../lib/Msg'
import { useDispatchMsgTagger } from '../lib/useDispatchMsg'
import classNames from 'classnames'
import {
  LightBulbIcon,
  UserIcon,
  XCircleIcon,
  BellIcon,
  HomeIcon,
  MoonIcon,
  EyeOffIcon,
} from '@heroicons/react/outline'
import { Sound } from '../components/Sound'
import { ReactElement } from 'react'
import { Popover } from '@headlessui/react'

import { FullyKiosk, useFullyKiosk } from '../lib/useFullyKiosk'
import { getHostFromReq, HostSpec } from '../lib/getHostFromReq'
import { ModelUpdater } from '../components/ModelUpdater'
import { RoomLine } from '../components/RoomLine'
import { RoomTemp, TempReadings } from '../components/RoomTemp'
import { Weather } from '../components/Weather'
import { DayProgress } from '../components/DayProgress'
import { SceneButton, SceneSpec, SetSceneFn } from '../components/SceneButton'

type SceneSelectorProps = {
  scenes: SceneSpec[]
  scene: string | undefined
  setScene: SetSceneFn
}
const SceneSelector = ({ scenes, scene, setScene }: SceneSelectorProps) => {
  const currentScene = scenes.find((s) => s.scene === scene) || scenes[0]
  return (
    <Popover className="relative">
      <Popover.Button>
        <SceneButton sceneSpec={currentScene} />
      </Popover.Button>
      <Popover.Panel
        className="absolute z-10 p-4 bg-zinc-100 rounded-2xl shadow-xl"
        style={{ right: '0px' }}
      >
        {({ close }) =>
          scenes.map((s, i) => (
            <SceneButton
              key={i}
              sceneSpec={s}
              currentScene={scene}
              setScene={async () => {
                await setScene(s.scene)
                close()
              }}
            />
          ))
        }
      </Popover.Panel>
    </Popover>
  )
}

type SceneModel = { scene?: string; sensors?: Record<string, SensorReading> }

type RoomProps<Model extends SceneModel> = {
  model: Model
  scenes: SceneSpec[]
  room: string
}
function Room<Model extends SceneModel>({
  model,
  room,
  scenes,
}: RoomProps<Model>) {
  const setScene = useDispatchMsgTagger(SetScene(room))
  const occupied = true

  const occupiedIcon = `${occupied ? 'text-green-500' : 'text-gray-200'}`

  const Icon = <UserIcon className={occupiedIcon}></UserIcon>
  const MiniSlot = <RoomTemp readings={model.sensors as TempReadings} />
  const Menu = (
    <SceneSelector scenes={scenes} scene={model.scene} setScene={setScene} />
  )

  return <RoomLine Icon={Icon} MiniSlot={MiniSlot} name={room} Action={Menu} />
}

const officeScenes: SceneSpec[] = [
  { scene: 'off', Icon: XCircleIcon },
  { scene: 'dim', colour: 'amber' },
  { scene: 'morning2', colour: 'amber' },
  { scene: 'bright', colour: 'amberbright' },
  { scene: 'work', colour: 'sky' },
  { scene: 'purple' },
  { scene: 'blue' },
]
const Office = ({ model }: { model: RoomModel }) => (
  <Room room="office" scenes={officeScenes} model={model} />
)

const bedroomScenes: SceneSpec[] = [
  { scene: 'off', Icon: XCircleIcon },
  { scene: 'dim', colour: 'amber' },
  { scene: 'bright', colour: 'amberbright' },
  { scene: 'work', colour: 'sky' },
]
const Bedroom = ({ model }: { model: RoomModel }) => (
  <Room room="bedroom" scenes={bedroomScenes} model={model} />
)

const backroomScenes: SceneSpec[] = [
  { scene: 'off', Icon: XCircleIcon },
  { scene: 'dim', colour: 'amber' },
  { scene: 'bright', colour: 'amberbright' },
  { scene: 'work', colour: 'sky' },
]
const Backroom = ({ model }: { model: RoomModel }) => (
  <Room room="backroom" scenes={backroomScenes} model={model} />
)

const playroomScenes: SceneSpec[] = [
  { scene: 'off', Icon: XCircleIcon },
  { scene: 'dim', colour: 'amber' },
  { scene: 'bright', colour: 'amberbright' },
  { scene: 'work', colour: 'sky' },
]
const Playroom = ({ model }: { model: RoomModel }) => (
  <Room room="playroom" scenes={playroomScenes} model={model} />
)

const kidRoomScenes: SceneSpec[] = [
  { scene: 'off', Icon: XCircleIcon },
  { scene: 'dim', colour: 'amber' },
  { scene: 'bright', colour: 'amberbright' },
  { scene: 'work', colour: 'sky' },
]
const SamsRoom = ({ model }: { model: RoomModel }) => (
  <Room room="sams-room" scenes={kidRoomScenes} model={model} />
)
const PipersRoom = ({ model }: { model: RoomModel }) => (
  <Room room="pipers-room" scenes={kidRoomScenes} model={model} />
)

type GlobalRowProps = { model: Model; doorbell: boolean }
const GlobalRow = ({ doorbell }: GlobalRowProps) => {
  useFullyKiosk(
    (fully: FullyKiosk) => {
      if (doorbell) {
        fully.stopScreensaver()
        fully.showToast('door bell!')
      }
    },
    [doorbell],
  )
  // const clearDoorbell = useDispatchMsgTagger(SetConsts([['doorbell', false], ['doorbellBlink', false]]))
  const clearDoorbell = useDispatchMsgTagger(
    PushEvent('doorbellEvents', 'cancelled'),
  )
  const leaveHouse = useDispatchMsgTagger(LeaveHouse)
  const bedtime = useDispatchMsgTagger(Bedtime)
  const Icon = doorbell ? (
    <BellIcon className="h-8 w-8 text-red-500" />
  ) : (
    <BellIcon className="h-8 w-8 text-gray-400" />
  )

  return (
    <>
      {doorbell && <Sound sound="doorbell-1" />}
      <div className="text-gray-600 flex flex-row justify-start py-3 xl:py-6 pr-8 min-w-full place-content-center">
        <div className="flex flex-row py-2 place-content-center">
          <HomeIcon className="w-8 h-8 text-gray-400" />
        </div>
        <div className="text-gray-600 flex flex-row justify-end min-w-full place-content-center">
          <button
            className={
              'w-16 h-12 rounded py-2 px-4 w-full flex flex-row content-center border border-gray-400'
            }
            onClick={leaveHouse}
          >
            <EyeOffIcon className="h-8 w-8 text-gray-400" />
          </button>
          <button
            className={
              'w-16 h-12 rounded py-2 px-4 w-full flex flex-row content-center border border-gray-400'
            }
            onClick={bedtime}
          >
            <MoonIcon className="h-8 w-8 text-gray-400" />
          </button>
          <button
            className={classNames(
              'w-16 h-12 rounded py-2 px-4 w-full flex flex-row content-center',
              { 'bg-gray-200': doorbell, 'border border-gray-400': !doorbell },
            )}
            onClick={clearDoorbell}
          >
            {Icon}
          </button>
        </div>
      </div>
    </>
  )
}

type ModelProps = { model: Model }

const Rooms = ({ model }: ModelProps) => {
  return (
    <>
      <Weather />
      <GlobalRow model={model} doorbell={doorbellRinging(model)} />
      <Bedroom model={model.rooms.bedroom}></Bedroom>
      <Backroom model={model.rooms.backroom}></Backroom>
      <Office model={model.rooms.office}></Office>
      <Playroom model={model.rooms.playroom}></Playroom>
      <SamsRoom model={model.rooms['sams-room']}></SamsRoom>
      <PipersRoom model={model.rooms['pipers-room']}></PipersRoom>
    </>
  )
}

type HomeProps = { host: HostSpec }
const Home: NextPage<HomeProps> = ({ host }: HomeProps) => {
  return (
    <ModelUpdater
      host={host}
      render={(model) => (
        <>
          <div className="bg-blue-300 min-h-screen 2xl:pt-16">
            <div className="container mx-auto max-w-full 2xl:max-w-2xl 2xl:shadow-lg 2xl:rounded-xl">
              <header
                className={classNames(
                  '2xl:rounded-t-xl mx-auto h-16 2xl:h-32',
                  {
                    'bg-purple-600': !model.doorbell,
                    'bg-red-600': model.doorbell,
                  },
                )}
              >
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
        </>
      )}
    />
  )
}

Home.getInitialProps = ({ req }) => {
  return { host: getHostFromReq(req) }
}

export default Home
