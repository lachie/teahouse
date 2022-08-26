import classNames from "classnames"
import { useDispatchMsgTagger } from '../lib/useDispatchMsg'
import { NextPage } from "next"
import StdLayout from "../components/StdLayout"
import { PushEvent } from '../lib/Msg'


const Frontdoor: NextPage = () => {
    const ringDoorbell = useDispatchMsgTagger(PushEvent('doorbellEvents', 'triggered'))
    const clearDoorbell = useDispatchMsgTagger(PushEvent('doorbellEvents', 'cancelled'))

    return <StdLayout>{(model) => <div>
        <button onClick={ringDoorbell} >ring</button>
        <button onClick={clearDoorbell} >cancel</button>
        <ul>
            {model.doorbellEvents.map(([at, event]) => <li>
                {at.toDateString()} - {event}
            </li>)}
        </ul>
    </div>
    }</StdLayout>
}


export default Frontdoor
