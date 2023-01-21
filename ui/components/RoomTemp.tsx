import { ReactElement } from "react"
import { degSym, pcSym } from "../lib/symbolMakers"

export type TempReadings = { temperature: number, humidity: number }

type RoomTempProps = { readings: TempReadings }
export const RoomTemp = ({ readings }: RoomTempProps): ReactElement => {
  console.log("readings", readings)
  return <div className="flex flex-col w-16 text-xs font-semibold text-gray-400">
    <div>{degSym(readings.temperature)}</div>
    <div>{pcSym(readings.humidity)}</div>
  </div>
}