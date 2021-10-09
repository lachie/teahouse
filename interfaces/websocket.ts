import * as t from 'io-ts'
import { WebSocketServer } from 'ws'
import { InterfaceFactory } from '.'

export default class WebsocketInterfaceFactory<
  Msg,
  Model,
> extends InterfaceFactory<Msg, Model> {
  constructor(public dec: t.Decoder<unknown, Msg>, public port = 3031) {
    super()
  }
  build() {
    const { subToModelChange, unsubToModelChange, port } = this
    if (subToModelChange === undefined || unsubToModelChange === undefined) {
      throw new Error("can't build websocket interface without sub and unsub")
    }

    console.log(`ws listening on ${port}`)
    const wss = new WebSocketServer({ port })

    wss.on('connection', (ws) => {
      console.log('ws connected')
      ws.on('message', (msg) => {
        console.log('got message', msg.toString())
      })
      ws.send('hello')

      const handler = (model: Model) => {
        console.log('ws sending model', model)
        ws.send(JSON.stringify(model))
      }

      subToModelChange(handler)
      ws.on('close', () => unsubToModelChange(handler))
    })
  }
}
