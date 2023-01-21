import { ReactElement } from "react";
import useSWR from "swr";
import { WiCloud, WiDaySunny, WiDaySunnyOvercast, WiShowers } from 'react-icons/wi'
import { RoomTemp } from "./RoomTemp";
import { RoomLine } from "./RoomLine";
import { degSym } from "../lib/symbolMakers"

const fetcher = (url: string) => fetch(url).then((res) => res.json());


type WeatherDay = {
  icon_descriptor: string
  rain: { chance: number, amount: { min: number, max: number } }
  temp_max: number
  temp_min: number
  short_text: string
  extended_text: string
  now: { temp_now: number, now_label: string, temp_later: number, later_label: string }
}
type WeatherObservations = {
  temp: number
  temp_feels_like: number
  humidity: number
}

export type WeatherProps = {}
export const Weather = ({ }: WeatherProps): ReactElement => {
  const { data, error } = useSWR("/api/bom", fetcher)

  if (error) return <>Weather error {JSON.stringify(error)}</>
  if (!data) return <>Weather loading...</>

  const day = data.daily[0] as WeatherDay
  const obs = data.observations as WeatherObservations

  let Icon
  switch (day.icon_descriptor) {
    case 'shower':
      Icon = WiShowers
      break
    case 'sunny':
      Icon = WiDaySunny
      break
    case 'mostly_sunny':
      Icon = WiDaySunnyOvercast
      break
    default:
      Icon = WiCloud
  }

  const summary = <div>
    {day.short_text}&nbsp;
    <span className="text-sm font-normal">
      [{day.rain.chance}%, {day.rain.amount.min}&ndash;{day.rain.amount.max}mm]
      [{day.now.now_label} {degSym(day.now.temp_now)}, {day.now.later_label} {degSym(day.now.temp_later)}]
    </span>
  </div>

  const slot = <RoomTemp readings={{ temperature: obs.temp, humidity: obs.humidity }} />
  //  size="32" color="rgb(156 163 175)"
  return <RoomLine Icon={Icon && <Icon className="h-8 w-8 text-gray-400" />} MiniSlot={slot} name={summary} />
}