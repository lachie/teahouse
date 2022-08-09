import { CronJob } from 'cron'
import Emittery from 'emittery'
import { Updater } from './updater'

type Every = string
type Tagger<Msg> = (a: Date) => Msg
type Taggers<Msg> = Record<Every, Tagger<Msg>[]>

export type Cron<Msg> = {
  type: 'cron'
  every: Every
  tagger: Tagger<Msg>
}
export const Cron = <Msg>(every: Every, tagger: Tagger<Msg>): Cron<Msg> => ({
  type: 'cron',
  every,
  tagger,
})

export class CronEffect<Msg> {
  cronjobs: Record<string, CronJob> = {}
  updater: Updater<Cron<Msg>>
  constructor(readonly sendToApp: (m: Msg) => void) {
    this.updater = new Updater(this.added.bind(this), this.removed.bind(this), this.subToString.bind(this))
  }

  added({ every, tagger }: Cron<Msg>) {
    this.cronjobs[every] = new CronJob({
      cronTime: every,
      onTick: () => {
        const now = new Date()
        this.sendToApp(tagger(now))
      },
      start: true,
    })
  }

  removed({ every }: Cron<Msg>) {
    this.cronjobs[every]?.stop()
    delete this.cronjobs[every]
    // delete this.taggers[every]
  }
  subToString({every}: Cron<Msg>): string { return every }

  isSub(sub: { type: string }): sub is Cron<Msg> {
    return sub.type == 'cron'
  }

  update(subs: Cron<Msg>[]) {
    this.updater.update(subs)
  }
}
