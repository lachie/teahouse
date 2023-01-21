import { ReactElement, ReactNode } from "react"

type RoomLineProps = {
  Icon?: ReactNode
  MiniSlot?: ReactNode
  name: ReactNode
  Action?: ReactElement
}
export const RoomLine = ({ Icon, MiniSlot, name, Action }: RoomLineProps): ReactElement =>
  <div className="text-gray-600 flex flex-row justify-start py-3 xl:py-6 min-w-full place-content-center">
    <div className="flex flex-row py-2 place-content-center">
      <div className="h-8 w-8 float-left mt-0.5 mr-3 ">
        {Icon}
      </div>
      <div className="w-16">
        {MiniSlot || ' '}
      </div>
      <span className="text-2xl text-gray-400 font-semibold">{name} </span>
    </div>
    <div className="flex flex-row flex-1 justify-end">
      <div className="w-16">
        {Action}
      </div>
    </div>
  </div>