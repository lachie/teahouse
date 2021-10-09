import { pipe } from 'fp-ts/function'
import { mapLeft, match } from 'fp-ts/Either'
import * as t from 'io-ts'
import useSWR from 'swr'
import { getOrElseW } from 'fp-ts/Either'
import { failure } from 'io-ts/PathReporter'
import ky from 'ky'

export const getOrError = getOrElseW((errors: t.Errors) => {
  throw new Error(failure(errors).join('\n'))
})

const mapErrors = mapLeft((errors: t.Errors) => failure(errors).join('\n'))

export function useFetchModel<M>(key: string, decoder: t.Decoder<any, M>) {
  const fetcher = async (key: string): Promise<M> => {
    return ky
      .get(key, { prefixUrl: 'http://192.168.86.28:3030' })
      .then((res) => res.json())
      .then(
        (json) =>
          new Promise((resolve, reject) => {
            pipe(
              json,
              (x) => (console.log(x), x),
              decoder.decode,
              mapErrors,
              match(reject, resolve),
            )
          }),
      )
  }

  return useSWR(key, fetcher)
}
