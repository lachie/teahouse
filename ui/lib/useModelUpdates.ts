import { pipe } from 'fp-ts/lib/function'
import { Json, parse } from 'fp-ts/Json'
import { useEffect, useState } from 'react'
import { map, mapLeft, match } from 'fp-ts/Either'
import * as t from 'io-ts'
import { failure } from 'io-ts/PathReporter'

const mapErrors = mapLeft((errors: t.Errors) => failure(errors).join('\n'))

type State<Model> = { model?: Model; errors?: string }
export function useModelUpdates<Model>(decoder: t.Decoder<unknown, Model>) {
  const [state, setState] = useState<State<Model>>({
    model: undefined,
    errors: undefined,
  })
  const [listening, setListening] = useState(false)

  const setErrors = (errors: string) => setState({ errors })
  const setModel = (model: Model) => setState({ model })

  useEffect(() => {
    console.log('in useEffect, listening: ', listening)
    if (!listening) {
      const events = new EventSource('http://bops.home:3030/model-updates')
      events.onopen = () => {
        setListening(true)
      }
      events.onmessage = (event) => {
        pipe(
          JSON.parse(event.data),
          (x) => (console.log(x), x),
          decoder.decode,
          mapErrors,
          match(setErrors, setModel),
        )
        setListening(true)
      }
      events.onerror = (...args: any[]) => {
        events.close()
        setListening(false)
        setErrors(JSON.stringify(args))
      }
      setListening(true)
    }
  }, [listening, state])

  return state
}
