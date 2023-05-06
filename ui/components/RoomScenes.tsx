import { LightBulbIcon, XCircleIcon } from '@heroicons/react/outline'
import { ReactElement } from 'react'

export const colours = {
  disabled: 'bg-gray-200 ring-gray-200',
  green: 'bg-green-500 ring-green-500',
  red: 'bg-red-500 ring-red-500',
  blue: 'bg-blue-500 ring-blue-500',
  amber: 'bg-amber-200 ring-amber-300',
  amberbright: 'bg-amber-300 ring-amber-200',
  sky: 'bg-sky-100 ring-sky-100',
}
export type ColourKey = keyof typeof colours

type IconComp = (p: { className: string }) => ReactElement
export type SceneSpec = {
  scene: string
  colour?: ColourKey
  Icon?: IconComp
}

export const playroomScenes: SceneSpec[] = [
  { scene: 'off', Icon: XCircleIcon },
  { scene: 'dim', colour: 'amber' },
  { scene: 'bright', colour: 'amberbright' },
  { scene: 'work', colour: 'sky' },
]
export const officeScenes: SceneSpec[] = [
  { scene: 'off', Icon: XCircleIcon },
  { scene: 'dim', colour: 'amber' },
  { scene: 'morning2', colour: 'amber' },
  { scene: 'bright', colour: 'amberbright' },
  { scene: 'work', colour: 'sky' },
  { scene: 'purple' },
  { scene: 'blue' },
]

export const roomScenes = {
  'playroom': playroomScenes,
  'office': officeScenes,
} as const

export type Rooms = keyof typeof roomScenes