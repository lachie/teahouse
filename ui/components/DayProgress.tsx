import { MoonIcon, SunIcon } from "@heroicons/react/outline"
import { Model } from "../lachies-house/Model"
import format from 'date-fns/format'

export const DayProgress = ({ model }: {model: Model}) => {
  const { sunProgress: [prog, dayNight] } = model

  const icon = dayNight === 'day' ? <SunIcon /> : <MoonIcon />
  const left = `${Math.round(prog * 100)}%`
  const timeS = format(model.date, 'kk:mm')

  return (
    <>
      <div className='w-full rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500'>
        <div className="px-4 w-full">
          <div className='relative h-8 w-8 -mx-4 text-white' style={{ left }}>{icon}</div>
        </div>
      </div>
      <div className='px-4 w-full'>
        <div className='relative h-8 w-8 -mx-4 text-s font-semibold text-gray-400 text-center' style={{ left }}>{timeS}</div>
      </div>
    </>
  )
}