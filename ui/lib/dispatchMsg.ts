import ky from 'ky'
import { Msg } from './Msg'

export default async function dispatchMsg(m: Msg): Promise<void> {
  const url = `http://192.168.86.28:3030/msg`
  await ky.post(url, { json: m })
}
