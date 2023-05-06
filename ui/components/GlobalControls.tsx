import {
  BellIcon,
  EyeOffIcon,
  MoonIcon,
} from '@heroicons/react/outline'
import { ReactElement } from 'react'
import { useDispatchMsgTagger } from '../lib/useDispatchMsg'
import { LeaveHouse, Bedtime, PushEvent } from '../lachies-house/Msg'
import { Sound } from '../components/Sound'
import { FullyKiosk, useFullyKiosk } from '../lib/useFullyKiosk'
import { ModelProps } from './ModelProps'
import { Button } from './Buttons'

export const Globals = ({
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