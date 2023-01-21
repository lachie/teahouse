import express from 'express'
import { pipe } from 'fp-ts/function'
import { match, mapLeft } from 'fp-ts/Either'
import * as t from 'io-ts'
import { failure } from 'io-ts/PathReporter'
import morgan from 'morgan'
import cors from 'cors'
import { InterfaceFactory } from './index'
// import OAuth2Server from 'oauth2-server'
// import { Model } from './oauthModel'

const mapErrors = mapLeft((errors: t.Errors) => failure(errors).join(','))

export default class HttpInterfaceFactory<Msg, Model> extends InterfaceFactory<
  Msg,
  Model
> {
  // readonly oauthServer: OAuth2Server
  constructor(public dec: t.Decoder<unknown, Msg>, oauthDBPath: string, public port = 3000) {
    super()
    // this.oauthServer = new OAuth2Server({
    //   model: new Model(oauthDBPath),
    // })
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
    app.post('/msg', (req, res) =>
      pipe(
        req.body,
        (x) => (console.log('body', x), x),
        this.dec.decode,
        (x) => (console.log('decoded', x), x),
        mapErrors,
        match(
          (errs) => {
            res.status(500).send(errs)
          },
          (msg) => {
            dispatchMessage(msg)
            res.send('OK')
          },
        ),
      ),
    )

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
