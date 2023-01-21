import { Device } from './device'
import { Node } from '../house'
import { RuntimeContext, Secrets } from '../runtime'
import { CronJob } from 'cron'
import { Grandstream } from '../integration/grandstream'

export type PersonNode<Msg> = Node & {
  type: 'person'
  name: string
  macs: string[]
  arriveTagger: () => Msg
  leaveTagger: () => Msg
}

export class Person<Msg> extends Device<PersonNode<Msg>, Msg> {
  people: Record<string, PersonNode<Msg>> = {}
  #macIndex: Record<string, string> = {}
  presentPeople = new Set<string>()
  cronjob: CronJob
  grandstream: Grandstream
  #started = false
  dispatchMessage?: (m: Msg) => void
  constructor(secrets: Secrets) {
    super()
    this.cronjob = new CronJob({
      cronTime: '*/20 * * * * *',
      onTick: () => this.tick(),
      start: false,
    })
    this.grandstream = new Grandstream(
      secrets.grandstream.username,
      secrets.grandstream.password,
    )
  }
  static make<Msg>(
    key: string,
    name: string,
    macs: string[],
    arriveTagger: () => Msg,
    leaveTagger: () => Msg
  ): PersonNode<Msg> {
    return {
      type: 'person',
      key,
      name,
      macs,
      arriveTagger,
      leaveTagger,
    }
  }

  get hasPeople(): boolean {
    return Object.keys(this.people).length > 0
  }

  async tick() {
    if(this.dispatchMessage === undefined) {
      return
    }
    const clients = await this.grandstream.getClients()
    // console.log("clients", clients)
    const macs = clients
      .filter(x => x)
      .filter((c) => c.online)
      .reduce((cs, c) => cs.add(c.client_mac), new Set<string>())
    console.log("macs", macs)
    console.log("mac index", this.#macIndex)
    const people = [...macs].reduce<Set<string>>((pp, mac) => {
        const person = this.#macIndex[mac]
        if(person) { pp.add(person) }
        return pp
      },
      new Set<string>(),
    )
    console.log("presentPeople", this.presentPeople)
    console.log("matched people", people)

    let newPeople = new Set(
      [...people].filter((i) => !this.presentPeople.has(i)),
    )
    let leftPeople = new Set(
      [...this.presentPeople].filter((i) => !people.has(i)),
    )
    this.presentPeople = people

    console.log("newPeople", newPeople)
    console.log("leftPeople", leftPeople)

    for(const p of newPeople) {
      console.log("arrive", p)
      this.dispatchMessage(this.people[p]?.arriveTagger())
    }
    for(const p of leftPeople) {
      console.log("leave", p)
      this.dispatchMessage(this.people[p]?.leaveTagger())
    }
  }

  async maybeStart(dispatchMessage: RuntimeContext<Msg>['dispatchMessage']) {
    if (!this.#started) {
      this.#started = true
      this.dispatchMessage = dispatchMessage
      await this.grandstream.login()
      await this.tick()
      this.cronjob.start()
    }
  }
  maybeStop() {
    if (!this.hasPeople) {
      this.cronjob.stop()
      this.#started = false
    }
  }

  async add({ schedMgr }: RuntimeContext<Msg>, p: PersonNode<Msg>) {
    this.people[p.key] = p
    this.#reindex()
    await this.maybeStart(schedMgr.dispatchMessage)
  }

  #reindex() {
    this.#macIndex = {}
    for (const p of Object.values(this.people)) {
      console.log("index", p)
      for (const m of p.macs) {
        const mm = m.replaceAll(/[^A-Za-z0-9]/g, '').toLowerCase()
        this.#macIndex[mm] = p.key
      }
    }
    console.log("people", this.people)
    console.log("macIndex", this.#macIndex)
  }

  async remove(_: RuntimeContext<Msg>, p: PersonNode<Msg>) {
    delete this.people[p.key]
    this.#reindex()
    this.maybeStop()
  }
}
