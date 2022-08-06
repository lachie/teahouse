import Emittery from 'emittery'

type Every = number
type Tagger<Msg> = (a: Date) => Msg
type Taggers<Msg> = Record<Every, Tagger<Msg>[]>

export type Tick<Msg> = {
  type: 'tick'
  every: Every
  tagger: Tagger<Msg>
}
export const Tick = <Msg>(every: Every, tagger: Tagger<Msg>): Tick<Msg> => ({
  type: 'tick',
  every,
  tagger,
})


export class CronEffect<Msg> {
  taggers: Taggers<Msg> = {}
  tickers: Record<string, NodeJS.Timeout> = {}
  bus = new Emittery()
  constructor(readonly sendToApp: (m: Msg) => void) {
    this.bus.on('tick', (time: number) => this.tick(time))
  }

  isSub(sub: { type: string }): sub is Tick<Msg> {
    return sub.type == 'tick'
  }

  tick(time: number) {
    const taggers = this.taggers[cronTime]
    const now = new Date()
    for (const tagger of taggers) {
      console.log('CronEffect sendToApp', tagger(now))
      this.sendToApp(tagger(now))
    }
  }

  update(subs: Tick<Msg>[]) {
    const newTaggers = subs.reduce(
      (taggers: Taggers<Msg>, { every, tagger }: Tick<Msg>) => (
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
