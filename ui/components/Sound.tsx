import { ReactElement, ReactNode } from 'react'
import ReactHowler from 'react-howler'

const isBrowser = typeof window !== 'undefined'

type SoundProps = {
    sound: string
}
const path = (key: string) => `/sounds/${key}.mp3`
export const Sound = ({sound}: SoundProps): ReactElement => isBrowser ? <ReactHowler src={path(sound)} loop /> : <></>