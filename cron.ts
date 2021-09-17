import { CronJob } from 'cron'
import Emittery from 'emittery'

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
  taggers: Taggers<Msg> = {}
  cronjobs: Record<string, CronJob> = {}
  bus = new Emittery()
  constructor(readonly sendToApp: (m: Msg) => void) {
    this.bus.on('tick', (cronTime: string) => this.cronTick(cronTime))
  }

  isSub(sub: { type: string }): sub is Cron<Msg> {
    return sub.type == 'cron'
  }

  cronTick(cronTime: string) {
    const taggers = this.taggers[cronTime]
    const now = new Date()
    for (const tagger of taggers) {
      this.sendToApp(tagger(now))
    }
  }

  update(subs: Cron<Msg>[]) {
    const newTaggers = subs.reduce(
      (taggers: Taggers<Msg>, { every, tagger }: Cron<Msg>) => (
        (taggers[every] ||= []).push(tagger), taggers
      ),
      {},
    )
    const newCronTimes = Object.keys(newTaggers)

    const makeCronJob = (cronTime: string): CronJob => {
      return new CronJob({
        cronTime,
        onTick: () => {
          this.bus.emit('tick', cronTime)
        },
        start: true,
      })
    }

    const oldCronTimes = Object.keys(this.taggers)

    oldCronTimes
      .filter((t) => !newCronTimes.includes(t))
      .map((t) => {
        this.cronjobs[t].stop()
      })
    this.cronjobs = newCronTimes
      .filter((t) => !oldCronTimes.includes(t))
      .reduce<Record<string, CronJob>>(
        (cronjobs, t) => ((cronjobs[t] = makeCronJob(t)), cronjobs),
        {},
      )

    this.taggers = newTaggers
  }

  key(sub: Cron<Msg>): string {
    return sub.tagger.toString()
  }
}
