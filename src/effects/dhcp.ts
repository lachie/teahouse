import { Match } from 'ts-pattern/lib/types/Match'
import { Updater } from './updater'
import * as dhcp from 'dhcp'

type Tagger<Msg> = (s: string) => Msg
export type Dhcp<Msg> = {
  type: 'dhcp'
  tagger: Tagger<Msg>
}
export const Dhcp = <Msg>(tagger: Tagger<Msg>): Dhcp<Msg> => ({
  type: 'dhcp',
  tagger,
})
export class DhcpEffect<Msg> {
  updater: Updater<Dhcp<Msg>>
  dhcp?: dhcp.DhcpHandler
  constructor(readonly sendToApp: (m: Msg) => void) {
    this.updater = new Updater(
      this.added.bind(this),
      this.removed.bind(this),
      this.subToString.bind(this),
    )
  }

  added({ tagger }: Dhcp<Msg>) {
    this.dhcp = dhcp.createBroadcastHandler()

    this.dhcp.on('message', (data: any) => {
      console.log('dhcp msg', data)
      if (data.options[53] === dhcp.DHCPDISCOVER) {
        const mac = data.chaddr.replaceAll('-', ':')
        const msg = tagger(mac)
        if (msg) {
          this.sendToApp(msg)
        }
      }
    })

    this.dhcp.listen()
  }

  removed(_: Dhcp<Msg>) {
    if(this.dhcp !== undefined) {
        this.dhcp.close()
    }
  }
  subToString({ tagger }: Dhcp<Msg>): string {
    return tagger.toString()
  }

  isSub(sub: { type: string }): sub is Dhcp<Msg> {
    return sub.type == 'dhcp'
  }

  update(subs: Dhcp<Msg>[]) {
    this.updater.update(subs)
  }
}
