import { Cron, CronEffect } from '../effects/cron'

type SubManagers<Msg> = {
  cron: CronEffect<Msg>
}

type Batch<Msg> = { type: 'batch'; subs: Sub<Msg>[] }
type OneSub<Msg> = { type: 'sub'; sub: { type: keyof SubManagers<Msg> } }
type None = { type: 'none' }

export type Sub<Msg> = Batch<Msg> | OneSub<Msg> | None
export const Sub = <Msg>(subSpec: {
  type: keyof SubManagers<Msg>
}): OneSub<Msg> => {
  return { type: 'sub', sub: subSpec }
}

export class SubscriptionsManager<Msg> {
  subManagers: SubManagers<Msg>
  constructor(readonly sendToApp: (m: Msg) => void) {
    this.subManagers = {
      cron: new CronEffect(sendToApp),
    }
  }
  updateSubs(subsFromApp: Sub<Msg>) {
    const subs = this.flatSubs(subsFromApp).map((s) => s.sub)
    const mgrs = [this.subManagers.cron]

    for (const mgr of mgrs) {
      const mgrSubs = subs.filter(mgr.isSub)
      mgr.update(mgrSubs)
    }
  }

  flatSubs(sub: Sub<Msg>): OneSub<Msg>[] {
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
