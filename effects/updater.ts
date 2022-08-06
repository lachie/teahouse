export class Updater<T> {
  taggers: Record<string, T[]>
  constructor(
    readonly added: (tagger: T) => void,
    readonly removed: (tagger: T) => void,
    readonly subToString: (t: T) => string,
  ) {
    this.taggers = {}
  }

  update(subs: T[]) {
    const newTaggers: Record<string, T[]> = subs.reduce(
      (taggers: Record<string, T[]>, tagger: T) => (
        (taggers[this.subToString(tagger)] ||= []).push(tagger), taggers
      ),
      {} as Record<string, T[]>,
    )

    const newKeys = Object.keys(newTaggers)
    const oldKeys = Object.keys(this.taggers)

    oldKeys.filter((t) => !newKeys.includes(t)).flatMap(t => this.taggers[t]).forEach(this.removed)
    newKeys
      .filter((t) => !oldKeys.includes(t))
      .flatMap((t) => this.taggers[t])
      .forEach(this.added)

    this.taggers = newTaggers
  }
}
