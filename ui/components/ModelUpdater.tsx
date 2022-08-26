import { ReactNode, ReactElement } from "react"
import { Model, ModelT } from "../lib/Model"
import { useModelUpdates } from "../lib/useModelUpdates"

type ModelUpdaterProps = {
  render: (m: Model) => ReactNode
}
export const ModelUpdater = ({ render }: ModelUpdaterProps): ReactElement => {
  const { model, errors } = useModelUpdates(ModelT)

  console.log('m', model)
  console.log('e', errors)

  if (errors) return <b>oops: {JSON.stringify(errors)}</b>
  if (!model) return <div>loading...</div>

  const comp = render(model)

  return <>{comp ? comp : null}</>
}