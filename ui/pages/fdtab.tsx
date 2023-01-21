import type { NextPage } from 'next'
import { getHostFromReq, HostSpec } from '../lib/getHostFromReq'
import { ModelUpdater } from '../components/ModelUpdater'
import classNames from 'classnames'
import {
  BellIcon,
  EyeOffIcon,
  HomeIcon,
  MoonIcon,
} from '@heroicons/react/outline'
import { Model, present, doorbellRinging, RoomModel } from '../lib/Model'
import { Weather } from '../components/Weather'
import { DayProgress } from '../components/DayProgress'
import { ReactElement, ReactNode } from 'react'
import { useDispatchMsgTagger } from '../lib/useDispatchMsg'
import { LeaveHouse, Bedtime, PushEvent, SetScene } from '../lib/Msg'
import { playroomScenes, SceneButton } from '../components/SceneButton'
import { Sound } from '../components/Sound'
import { FullyKiosk, useFullyKiosk } from '../lib/useFullyKiosk'

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>
const Button = (props: ButtonProps): ReactElement => (
  <button
    className="w-16 h-12 rounded py-2 px-4 w-full flex flex-row content-center border border-gray-400"
    {...props}
  />
)

type ThisRoomProps = ModelProps & { room: RoomModel }
const ThisRoom = ({ room }: ThisRoomProps): ReactElement => {
  const setScene = useDispatchMsgTagger(SetScene('playroom'))

  return (
    <div>
      {playroomScenes.map((s, i) => (
        <SceneButton
          key={i}
          sceneSpec={s}
          currentScene={room.scene}
          setScene={async () => {
            await setScene(s.scene)
          }}
        />
      ))}
    </div>
  )
}

const Globals = ({
  doorbell,
}: ModelProps & { doorbell: boolean }): ReactElement => {
  useFullyKiosk(
    (fully: FullyKiosk) => {
      if (doorbell) {
        fully.stopScreensaver()
        fully.showToast('door bell!')
      }
    },
    [doorbell],
  )
  const leaveHouse = useDispatchMsgTagger(LeaveHouse)
  const bedtime = useDispatchMsgTagger(Bedtime)
  const clearDoorbell = useDispatchMsgTagger(
    PushEvent('doorbellEvents', 'cancelled'),
  )
  const DoorbellIcon = doorbell ? (
    <BellIcon className="h-8 w-8 text-red-500" />
  ) : (
    <BellIcon className="h-8 w-8 text-gray-400" />
  )

  return (
    <div className="flex flex-row">
      {doorbell && <Sound sound="doorbell-1" />}
      <Button onClick={clearDoorbell}>{DoorbellIcon}</Button>
      <Button onClick={leaveHouse}>
        <EyeOffIcon className="h-8 w-8 text-gray-400" />
      </Button>
      <Button onClick={bedtime}>
        {' '}
        <MoonIcon className="h-8 w-8 text-gray-400" />
      </Button>
    </div>
  )
}

const PeopleComp = ({ model }: ModelProps): ReactElement => {
  return (
    <>
      people here
      {present(model).map((k, i) => (
        <div key={i}>{k.name}</div>
      ))}
    </>
  )
}

const Header = ({ model }: ModelProps): ReactElement => (
  <header
    className={classNames('mx-auto h-16', {
      'bg-purple-600': !model.doorbell,
      'bg-red-600': model.doorbell,
    })}
  >
    <section className="flex items-center justify-center min-h-full">
      <div className="text-center text-white text-3xl font-semibold flex flex-row">
        T<HomeIcon className="w-8 h-8" />
      </div>
    </section>
  </header>
)

const Card = ({ children }: { children: ReactNode }): ReactElement => (
  <div className="basis-1/4 bg-slate-100 shadow-xl rounded-2xl">{children}</div>
)

type ModelProps = { model: Model }
const Room = ({ model }: ModelProps) => {
  return <></>
}

type HomeProps = { host: HostSpec }
const Home: NextPage<HomeProps> = ({ host }: HomeProps) => {
  return (
    <ModelUpdater
      host={host}
      render={(model) => (
        <>
          <div className="flex flex-row flex-wrap basis-1/4 mx-auto max-w-full gap-4">
            <Card>
              <DayProgress model={model} />
            </Card>
            <Card>
              <Weather />
            </Card>
            <Card>
              <Globals model={model} doorbell={doorbellRinging(model)} />
            </Card>
            <Card>
              <ThisRoom model={model} room={model.rooms.playroom} />
            </Card>
            <Card>
              <PeopleComp model={model} />
            </Card>
            <Card>
              <Room model={model} />
            </Card>
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
