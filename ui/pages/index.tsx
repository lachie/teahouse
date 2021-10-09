import type { NextPage } from 'next'
import Head from 'next/head'
import Image from 'next/image'
import Link from 'next/link'
import { useFetchModel } from '../lib/useFetchModel'
import { ModelT, PlayroomModel } from '../lib/Model'
import { LightState, SetLightOn, ToggleLight } from '../lib/Msg'
import { useDispatchMsg, useDispatchMsgTagger } from '../lib/useDispatchMsg'
import classNames from 'classnames'
import {
  LightBulbIcon,
  StatusOnlineIcon,
  UserIcon,
} from '@heroicons/react/outline'
import { LightBulbOffIcon } from '../lib/LightBulbOffIcon'
import { useModelUpdates } from '../lib/useModelUpdates'

type PlayroomProps = { model: PlayroomModel }
const Playroom = ({ model }: PlayroomProps) => {
  const setLightMode = useDispatchMsgTagger(SetLightOn('playroom'))

  const btn = 'py-2 px-4 text-white ring-opacity-50'

  const opc = (x: LightState) =>
    model.lightOn === x ? 'ring-2 z-50' : 'ring-0 z-0'

  const onBtn = `${btn} rounded-l-lg bg-green-500 ring-green-500 ${opc('on')}`
  const offBtn = `${btn} bg-red-500 ring-red-500 ${opc('off')}`
  const detectBtn = `${btn} rounded-r-lg bg-blue-500 ring-blue-500 ${opc(
    'detect',
  )}`

  const occupiedIcon = `h-8 w-8  float-left mt-0.5 mr-3 ${
    model.occupied ? 'text-green-500' : 'text-gray-200'
  }`

  return (
    <div className="text-gray-600 flex justify-around py-6">
      <div className="py-2">
        <UserIcon className={occupiedIcon}></UserIcon>
        <span className="text-2xl text-gray-400 font-semibold">Playroom </span>
      </div>
      <div className="">
        <button
          className={onBtn}
          onClick={() => setLightMode('on')}
          title="Switch the light on"
        >
          <LightBulbIcon className="h-8 w-8"></LightBulbIcon>
        </button>
        <button
          className={offBtn}
          onClick={() => setLightMode('off')}
          title="Switch the light off"
        >
          <LightBulbOffIcon className="h-8 w-8"></LightBulbOffIcon>
        </button>
        <button
          className={detectBtn}
          onClick={() => setLightMode('detect')}
          title="Put the light in detect mode"
        >
          <StatusOnlineIcon className="h-8 w-8"></StatusOnlineIcon>
        </button>
      </div>
    </div>
  )
}

const Rooms = () => {
  // const { data, error } = useFetchModel('model', ModelT)
  const { model, errors } = useModelUpdates(ModelT)

  console.log('m', model)
  console.log('e', errors)

  if (errors) return <b>oops: {JSON.stringify(errors)}</b>
  if (!model) return <div>loading...</div>

  return (
    <>
      <Playroom model={model.rooms.playroom}></Playroom>
    </>
  )
}

const Home: NextPage = () => {
  return (
    <div className="bg-blue-300 min-h-screen md:pt-16">
      <div className="container mx-auto md:max-w-2xl md:shadow-lg md:rounded-xl">
        <header className="bg-purple-600 md:rounded-t-xl mx-auto h-16 md:h-32">
          <section className="flex items-center justify-center min-h-full">
            <div className=" text-center text-white text-3xl font-semibold">
              Teahouse
            </div>
          </section>
        </header>

        <section className="mx-auto bg-white">
          <Rooms></Rooms>
        </section>
        <footer className="bg-purple-400 md:rounded-b-xl mx-auto h-8"></footer>
      </div>
    </div>
  )
}

export default Home
