import express from 'express'
import { pipe } from 'fp-ts/function'
import { match, mapLeft } from 'fp-ts/lib/Either'
import * as t from 'io-ts'
import { failure } from 'io-ts/PathReporter'
import { Json } from 'fp-ts/Json'
import morgan from 'morgan'
import cors from 'cors'

const mapErrors = mapLeft((errors: t.Errors) => failure(errors).join(','))

const app = express()

app.use(morgan('tiny'))
app.use(cors())

type DispatchMessage<Msg> = (m: Msg) => void
type GetModel = () => Json

export default function server<Msg>(
  dec: t.Decoder<unknown, Msg>,
  port = 3000,
): (yeet: DispatchMessage<Msg>, getModel: GetModel) => void {
  return (yeet: DispatchMessage<Msg>, getModel: () => Json) => {
    app.use(express.json())
    app.post('/msg', (req, res) =>
      pipe(
        req.body,
        dec.decode,
        (x) => (console.log(x), x),
        mapErrors,
        match(
          (errs) => {
            res.status(500).send(errs)
          },
          (msg) => {
            yeet(msg)
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

    app.listen(port, () => {
      console.log(`http interface listening on ${port}`)
    })
  }
}
