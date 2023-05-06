import { useDispatchMsgTagger } from '../lib/useDispatchMsg'
import { NextPage } from "next"
import StdLayout from "../components/StdLayout"
import { ClearRoomScenes, PushEvent } from '../lachies-house/Msg'
import { getHostFromReq, HostContext, HostSpecProps } from "../lib/getHostFromReq"

const FrontdoorC = ({host}: HostSpecProps) => {
    const ringDoorbell = useDispatchMsgTagger(PushEvent('doorbellEvents', 'triggered'))
    const clearDoorbell = useDispatchMsgTagger(PushEvent('doorbellEvents', 'cancelled'))
    const clearScenes = useDispatchMsgTagger(() => ({type: 'clear-room-scenes'}))

    return <StdLayout host={host}>{(model) => <div>
        <button onClick={ringDoorbell} >ring</button>
        <button onClick={clearDoorbell} >cancel</button>
        <button onClick={clearScenes} >clear scenes</button>
        <ul>
            {model.doorbellEvents.map(([at, event]) => <li>
                {at.toDateString()} - {event}
            </li>)}
        </ul>
    </div>
    }</StdLayout>

}

const Frontdoor: NextPage<HostSpecProps> = ({ host }) => <HostContext.Provider value={host}><FrontdoorC host={host} /></HostContext.Provider>

Frontdoor.getInitialProps = ({ req }) => {
  return { host: getHostFromReq(req) }
};

export default Frontdoor
