import express from 'express'
import { pipe } from 'fp-ts/function'
import { match, mapLeft } from 'fp-ts/lib/Either'
import * as t from 'io-ts'
import { failure } from 'io-ts/PathReporter'
import morgan from 'morgan'
import cors from 'cors'
import { InterfaceFactory } from './index'

const mapErrors = mapLeft((errors: t.Errors) => failure(errors).join(','))

export default class HttpInterfaceFactory<Msg, Model> extends InterfaceFactory<
  Msg,
  Model
> {
  constructor(public dec: t.Decoder<unknown, Msg>, public port = 3000) {
    super()
  }
  build() {
    const { dispatchMessage, getModel } = this
    if (dispatchMessage === undefined || getModel === undefined) {
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
        this.dec.decode,
        (x) => (console.log(x), x),
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

    app.get('/model/*', (req, res) => {
      res.json(getModel())
    })
    app.get('/model', (req, res) => {
      res.json(getModel())
    })

    app.listen(this.port, () => {
      console.log(`http interface listening on ${this.port}`)
    })
  }
}
