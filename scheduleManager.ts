export class ScheduleManager<Msg> {
  timers: Record<string, NodeJS.Timeout> = {}
  constructor(
    public key: string[] = [],
    public dispatchMessage: (m: Msg) => void = (m: Msg) => {},
  ) {}

  push(key: string) {
    return new ScheduleManager<Msg>(this.key.concat(key), this.dispatchMessage)
  }

  dispatchAfter(key: string, delay: number, msg: Msg) {
    this.cancelDispatch(key)

    const fullKey = [key, ...this.key].join('.')
    console.log('dispatchAfter', fullKey, delay)
    const newTimer = setTimeout(() => {
      console.log('running scheduled input', msg)
      console.log(this.dispatchMessage.toString())
      this.dispatchMessage(msg)
    }, delay)
    this.timers[fullKey] = newTimer
  }

  cancelDispatch(key: string) {
    const fullKey = [key, ...this.key].join('.')
    console.log('cancelDispatch', fullKey)

    const existingTimer = this.timers[fullKey]
    if (existingTimer !== undefined) {
      clearTimeout(existingTimer)
      delete this.timers[fullKey]
    }
  }
}
