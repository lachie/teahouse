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

type PlayroomProps = { model: PlayroomModel }
const Playroom = ({ model }: PlayroomProps) => {
  const setLightMode = useDispatchMsgTagger(SetLightOn('playroom'))

  const btn = 'py-2 px-4 text-white ring-opacity-50'

  const opc = (x: LightState) => (model.lightOn === x ? 'ring-2' : 'ring-0')

  const onBtn = `${btn} rounded-l-lg bg-green-500 ring-green-500 ${opc('on')}`
  const offBtn = `${btn} bg-red-500 ring-red-500 ${opc('off')}`
  const detectBtn = `${btn} rounded-r-lg bg-blue-500 ring-blue-500 ${opc(
    'detect',
  )}`

  return (
    <div className="text-gray-600 flex justify-around py-6">
      <div className="py-2">
        <span className="text-lg text-gray-400 font-semibold">Playroom </span>
        <div className="flex float-left h-5 w-5 text-green-500">
          <UserIcon className="h-5 w-5 absolute inline-flex animate-ping duration-1000 opacity-75"></UserIcon>
          <UserIcon className="h-5 w-5 relative inline-flex"></UserIcon>
        </div>
        &mdash; {model.occupied ? 'occupied' : 'empty'}
      </div>
      <div className="">
        <button className={onBtn} onClick={() => setLightMode('on')}>
          <LightBulbIcon className="h-8 w-8"></LightBulbIcon>
        </button>
        <button className={offBtn} onClick={() => setLightMode('off')}>
          <LightBulbOffIcon className="h-8 w-8"></LightBulbOffIcon>
        </button>
        <button className={detectBtn} onClick={() => setLightMode('detect')}>
          <StatusOnlineIcon className="h-8 w-8"></StatusOnlineIcon>
        </button>
      </div>
    </div>
  )
}

const Rooms = () => {
  const { data, error } = useFetchModel('model', ModelT)

  if (error) return <b>oops: {JSON.stringify(error)}</b>
  if (!data) return <div>loading...</div>

  return (
    <>
      <Playroom model={data.rooms.playroom}></Playroom>
    </>
  )
}

const Home: NextPage = () => {
  return (
    <div className="bg-blue-300 min-h-screen pt-16">
      <div className="container mx-auto max-w-2xl shadow-lg rounded-xl">
        <header className="bg-purple-600 rounded-t-xl mx-auto h-32">
          <section className="flex items-center justify-center min-h-full">
            <div className=" text-center text-white text-3xl font-semibold">
              Teahouse
            </div>
          </section>
        </header>

        <section className="mx-auto bg-white">
          <Rooms></Rooms>
        </section>
        <footer className="bg-purple-400 rounded-b-xl mx-auto h-8"></footer>
      </div>
    </div>
  )
}

export default Home
