import { useRouter } from 'next/router'
import { useCallback } from 'react'
import { ModelT, Model, PlayroomModel, PlayroomModelT } from '../../lib/Model'
import { useFetchModel } from '../../lib/useFetchModel'

function flattenKey(
  maybeKey: string | string[] | undefined,
): string | undefined {
  if (maybeKey === undefined) return undefined
  if (typeof maybeKey === 'string') {
    return maybeKey
  } else if ('length' in maybeKey) {
    return maybeKey.join('/')
  } else {
    return undefined
  }
}

const Room = () => {
  const router = useRouter()
  const key = flattenKey(router.query.key)
  const { data, error } = useFetchModel(key, ModelT)

  if (key === undefined) return <b>oops, no key</b>
  if (error) return <b>oops: {JSON.stringify(error)}</b>
  if (!data) return <div>loading...</div>

  switch (key) {
    case 'playroom':
      return (
        <div>
          Playroom: {data.rooms.playroom.occupied ? 'occupied' : 'empty'}
        </div>
      )
  }

  return <div>Unknown room {key}</div>
}

export default Room
