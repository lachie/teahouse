export class Updater<S> {
  subs: Record<string, S[]>
  constructor(
    readonly added: (s: S) => void,
    readonly removed: (s: S) => void,
    readonly key: (s: S) => string,
  ) {
    this.subs = {}
  }

  update(subs: S[]) {
    const newSubs: Record<string, S[]> = subs.reduce(
      (subs: Record<string, S[]>, s: S) => (
        (subs[this.key(s)] ||= []).push(s), subs
      ),
      {} as Record<string, S[]>,
    )

    const newKeys = Object.keys(newSubs)
    const oldKeys = Object.keys(this.subs)

    oldKeys.filter((t) => !newKeys.includes(t)).flatMap(t => this.subs[t]).forEach(this.removed)
    newKeys
      .filter((t) => !oldKeys.includes(t))
      .flatMap((t) => newSubs[t])
      .forEach(this.added)

    this.subs = newSubs
  }
}
