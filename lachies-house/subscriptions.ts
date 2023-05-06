import { Batch, Sub } from '../src/runtime/subscriptions'
import { Cron } from '../src/effects/cron'
import { Model, doorbellRinging } from './Model'
import { Msg, SetHour, ToggleBool } from './Msg'

// const mmm = (s: X): Y|undefined => match<X,Y>(s)

export const subscriptions = (model: Model): Sub<Msg> =>
  Batch([
    Sub(Cron('0 * * * * *', SetHour)),
    doorbellRinging(model) &&
      Sub(Cron('*/2 * * * * *', ToggleBool('doorbellBlink'))),
    // Sub(
    //   Dhcp((s: string): Msg | undefined =>
    //     match<string, Msg | undefined>(s)
    //       .with('3a:19:6e:65:3d:f3', PushEvent('userPresenceEvents', 'lachie'))
    //       .otherwise(() => undefined),
    //   ),
    // ),
    // Sub(Mqtt('zigbee2mqtt/#', SetZigbeeEvent))
  ])
