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

const btnClassName = 'py-2 px-4 text-white ring-opacity-50'

type IconComp = (p: { className: string }) => ReactElement
export type SceneSpec = {
  scene: string
  colour?: ColourKey
  Icon?: IconComp
}


export type SetSceneFn = (scene?: string) => Promise<void>
type SceneButtonProps = {
  currentScene?: string
  sceneSpec: SceneSpec
  setScene?: SetSceneFn
}
export const SceneButton = ({
  sceneSpec: { scene, Icon, colour },
  currentScene,
  setScene,
}: SceneButtonProps) => {
  const selected = scene === currentScene
  const className = `${btnClassName} ${colours[colour || 'disabled']}`
  Icon ||= LightBulbIcon
  const onClick = setScene ? () => setScene(scene) : () => {}
  return (
    <button
      className={`${className} relative`}
      onClick={onClick}
      title={`Set scene to ${scene}`}
    >
      {selected && (
        <div
          className="bg-white rounded-full w-2 h-2 absolute"
          style={{ left: '8px', top: '20px' }}
        ></div>
      )}
      <Icon className="h-8 w-8" />
    </button>
  )
}
