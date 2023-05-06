import type { NextPage } from 'next'
import { getHostFromReq, HostSpec } from '../../lib/getHostFromReq'
import { ModelUpdater } from '../../components/ModelUpdater'
import { doorbellRinging } from '../../lachies-house/Model'
import { Weather } from '../../components/Weather'
import { DayProgress } from '../../components/DayProgress'
import { ReactElement, ReactNode } from 'react'
import { Globals } from 'components/GlobalControls'
import { PeopleComp } from 'components/People'
import { RoomSceneControls } from 'components/RoomSceneControls'
import { DeskCtl } from 'components/DeskCtl'



const Card = ({ children }: { children: ReactNode }): ReactElement => (
  <div className="basis-1/4 bg-slate-100 shadow-xl rounded-2xl">{children}</div>
)

const ThisRoom = RoomSceneControls('office')

type HomeProps = { host: HostSpec }
const Home: NextPage<HomeProps> = ({ host }: HomeProps) => {
  return (
    <ModelUpdater
      host={host}
      render={(model) => (
        <>
          <div className="flex flex-row flex-wrap basis-1/4 mx-auto max-w-full gap-4">
            <Card>
                <DeskCtl model={model} />
                </Card>
            <Card>
              <Globals model={model} doorbell={doorbellRinging(model)} />
            </Card>
            <Card>
              <ThisRoom model={model} room={model.rooms.playroom} />
            </Card>
            <Card>
              <DayProgress model={model} />
            </Card>
            <Card>
              <Weather />
            </Card>
            <Card>
              <PeopleComp model={model} />
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
