import classNames from 'classnames'
import { BellIcon } from '@heroicons/react/outline'
import { Model } from '../lib/Model'
import React, { ReactElement, ReactNode } from 'react'
import { FullyKiosk, useFullyKiosk } from '../lib/useFullyKiosk'
import { useDispatchMsgTagger } from '../lib/useDispatchMsg'
import { PushEvent } from '../lib/Msg'
import { Sound } from './Sound'

type FrontdoorProps = { model: Model, doorbell: boolean }
export const FrontdoorButton = ({ doorbell }: FrontdoorProps) => {
    useFullyKiosk((fully: FullyKiosk) => {
        if (doorbell) {
            fully.stopScreensaver()
            fully.showToast("door bell!")
        }
    }, [doorbell])
    // const clearDoorbell = useDispatchMsgTagger(SetConsts([['doorbell', false], ['doorbellBlink', false]]))
    const clearDoorbell = useDispatchMsgTagger(PushEvent('doorbellEvents', 'cancelled'))
    const Icon = doorbell ? <BellIcon className='h-8 w-8 text-red-500' /> : <BellIcon className='h-8 w-8 text-gray-400' />

    return <>
        {doorbell && <Sound sound="doorbell-1" />}
        <button className={classNames(" rounded py-2 px-4 w-full flex flex-row content-center", { 'bg-gray-200': doorbell, 'border border-gray-400': !doorbell })} onClick={clearDoorbell}>{Icon}</button>
    </>
}