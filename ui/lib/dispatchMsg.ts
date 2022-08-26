import ky from 'ky'
import { HostSpec } from './getHostFromReq'
import { Msg } from './Msg'

export default async function dispatchMsg(
  host: HostSpec,
  m: Msg,
): Promise<void> {
  const url = `${host.api}/msg`
  await ky.post(url, { json: m })
}
