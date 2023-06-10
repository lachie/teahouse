import express from 'express'
import * as z from 'zod'
import morgan from 'morgan'
import cors from 'cors'
import { InterfaceFactory } from './index'
// import OAuth2Server from 'oauth2-server'
// import { Model } from './oauthModel'

export default class HttpInterfaceFactory<Msg, Model> extends InterfaceFactory<
  Msg,
  Model
> {
  // readonly oauthServer: OAuth2Server
  constructor(public msgSchema: z.ZodSchema<Msg>, public port = 3000) {
    super()
  }
  build() {
    const {
      dispatchMessage,
      getModel,
      getHouseState,
      subToModelChange,
      unsubToModelChange,
    } = this
    if (
      dispatchMessage === undefined ||
      getModel === undefined ||
      getHouseState === undefined ||
      subToModelChange === undefined ||
      unsubToModelChange === undefined
    ) {
      throw new Error(
        "can't build http interface without dispatchMessage and getModel",
      )
    }

    const app = express()
    app.use(morgan('tiny'))
    app.use(cors())
    app.use(express.json())
    app.post('/msg', (req, res) => {
      const result = this.msgSchema.safeParse(req.body)
      if (result.success) {
        dispatchMessage(result.data)
        res.send('OK')
      } else {
        res.status(400).send(result.error.errors)
      }
    })

    app.get('/model-updates', (req, res) => {
      const headers = {
        'Content-Type': 'text/event-stream',
        Connection: 'keep-alive',
        'Cache-Control': 'no-cache',
      }
      res.writeHead(200, headers)

      console.log('HTTP sending initial model', getModel())
      const data = `data: ${JSON.stringify(getModel())}\n\n`
      res.write(data)

      const clientHandler = (m: Model): void => {
        console.log('HTTP sending model', m)
        const data = `data: ${JSON.stringify(m)}\n\n`
        res.write(data)
      }

      subToModelChange(clientHandler)
      req.on('close', () => unsubToModelChange(clientHandler))
    })

    app.get('/model/*', (req, res) => {
      res.json(getModel())
    })
    app.get('/model', (req, res) => {
      res.json(getModel())
    })
    app.get('/house', (req, res) => {
      res.json(getHouseState())
    })

    app.listen(this.port, () => {
      console.log(`http interface listening on ${this.port}`)
    })
  }
}
