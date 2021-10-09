import ky from 'ky'
import { useEffect, useState } from 'react'
import { useSWRConfig } from 'swr'
import { Msg } from './Msg'
import dispatchMsg from './dispatchMsg'

export function useDispatchMsg(m: Msg) {
  // const { mutate } = useSWRConfig()

  return async () => {
    await dispatchMsg(m)
    // mutate('model')
  }
}

export function useDispatchMsgTagger(tagger: (...args: any[]) => Msg) {
  // const { mutate } = useSWRConfig()

  return async (...args: any[]) => {
    await dispatchMsg(tagger(...args))
    // mutate('model')
  }
}
