import { ReactElement } from "react"
import { ModelProps } from "./ModelProps"
import { present } from '../lachies-house/Model'

export const PeopleComp = ({ model }: ModelProps): ReactElement => {
  return (
    <>
      people here
      {present(model).map((k, i) => (
        <div key={i}>{k.name}</div>
      ))}
    </>
  )
}