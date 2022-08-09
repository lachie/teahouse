import { Device } from './device'
import { Node } from '../house'
import { RuntimeContext } from '../runtime'
import { isDeepStrictEqual } from 'node:util'
import TelegramBot from 'node-telegram-bot-api'
import { Msg } from '../lachies-house/Msg'

export type TelegramNode<P> = Node & {
    key: string
    payload: P
}

export abstract class TelegramBotX<Msg, P, D extends TelegramNode<P>> extends Device<D, Msg> {
    abstract publish(
        ctx: RuntimeContext<Msg>,
        device: D
    ): Promise<void>

    add(ctx: RuntimeContext<Msg>, device: D): void {
        this.publish(ctx, device)
    }

    update(ctx: RuntimeContext<Msg>, device: D, prevDevice: D) {
        if (!isDeepStrictEqual(device, prevDevice)) {
            this.publish(ctx, device)
        }
    }
}

export type TelegramMessageNode = TelegramNode<string> & { type: 'telegramMessage' }
export class TelegramMessage<Msg> extends TelegramBotX<Msg, string, TelegramMessageNode> {
  static make(key: string, payload: string): TelegramMessageNode {
    return {
      type: 'telegramMessage',
      key,
      payload
    }
  }
    async publish(ctx: RuntimeContext<Msg>, device: TelegramMessageNode): Promise<void> {
        const token = ctx.secrets.telegram.token
        const chatID = ctx.secrets.telegram.chatID
        const t = new TelegramBot(token)
        await t.sendMessage(chatID, device.payload)
    }

}