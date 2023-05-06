import ky from 'ky'
import { useContext, useEffect, useState } from 'react'
import { useSWRConfig } from 'swr'
import { Msg } from '../lachies-house/Msg'
import dispatchMsg from './dispatchMsg'
import { HostContext } from './getHostFromReq'

export function useDispatchMsg(m: Msg) {
  const host = useContext(HostContext)
  // const { mutate } = useSWRConfig()

  return async () => {
    await dispatchMsg(host, m)
    // mutate('model')
  }
}

export function useDispatchMsgTagger(tagger: (...args: any[]) => Msg) {
  const host = useContext(HostContext)
  // const { mutate } = useSWRConfig()

  return async (...args: any[]) => {
    await dispatchMsg(host, tagger(...args))
    // mutate('model')
  }
}
