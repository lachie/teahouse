import { Cron, CronEffect } from '../effects/cron'
import { DhcpEffect } from '../effects/dhcp';
import { Mqtt, MqttEffect } from '../effects/mqtt';

type SubManagers<Msg> = {
  cron: CronEffect<Msg>
  dhcp: DhcpEffect<Msg>
  // mqtt: MqttEffect<Msg>
}

type Batch<Msg> = { type: 'batch'; subs: Sub<Msg>[] }
type OneSub<Msg> = { type: 'sub'; sub: { type: keyof SubManagers<Msg> } }
type None = { type: 'none' }

export type Sub<Msg> = Batch<Msg> | OneSub<Msg> | None | undefined | false

export const Sub = <Msg>(subSpec: {
  type: keyof SubManagers<Msg>
}): OneSub<Msg> => {
  return { type: 'sub', sub: subSpec }
}
export const Batch = <Msg>(subs: Sub<Msg>[]): Batch<Msg> => ({
  type: 'batch',
  subs,
})
export const None = { type: 'none' }

export class SubscriptionsManager<Msg> {
  
  subManagers: SubManagers<Msg>
  constructor(readonly sendToApp: (m: Msg) => void) {
    this.subManagers = {
      cron: new CronEffect(sendToApp),
      dhcp: new DhcpEffect(sendToApp)
      // mqtt: new MqttEffect(sendToApp),
    }
  }
  updateSubs(subsFromApp: Sub<Msg>) {
    const subs = this.flatSubs(subsFromApp).map((s) => s.sub)

    {
      const mgr = this.subManagers.cron
      const mgrSubs = subs.filter(mgr.isSub)
      mgr.update(mgrSubs)
    }
    {
      const mgr = this.subManagers.dhcp
      const mgrSubs = subs.filter(mgr.isSub)
      mgr.update(mgrSubs)
    }

    // {
    //   const mgr = this.subManagers.mqtt
    //   const mgrSubs = subs.filter(mgr.isSub)
    //   mgr.update(mgrSubs)
    // }
  }

  flatSubs(sub: Sub<Msg>): OneSub<Msg>[] {
    if(!sub) {
      return []
    }
    switch (sub.type) {
      case 'batch':
        return sub.subs.flatMap((sub) => this.flatSubs(sub))
      case 'sub':
        return [sub]
      case 'none':
        return []
    }
  }
}
