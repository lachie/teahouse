import { ReactNode, ReactElement, useEffect } from 'react'
import { HostContext, HostSpec } from '../lib/getHostFromReq'
import { Model, ModelT } from '../lachies-house/Model'
import { useModelUpdates } from '../lib/useModelUpdates'

type ModelUpdaterProps = {
  render: (m: Model) => ReactNode
  host: HostSpec
}
export const ModelUpdater = ({
  render,
  host,
}: ModelUpdaterProps): ReactElement => {
  const { model, errors } = useModelUpdates(ModelT, host)
  useEffect(() => {
    if (errors?.length) {
      setTimeout(() => window.location.reload(), 1000)
    }
  }, [errors?.length])

  console.log('m', model)
  console.log('e', errors)

  if (errors) return <b>oops: {JSON.stringify(errors)}</b>
  if (!model) return <div>loading...</div>

  const comp = render(model)

  return comp ? (
    <HostContext.Provider value={host}>{comp}</HostContext.Provider>
  ) : (
    <></>
  )
}

