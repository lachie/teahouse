
// hash with default
export const hashMap =
  <V, K extends string = string>(
    h: Record<K, V | undefined>,
    defaultKey: K | undefined = undefined,
  ) =>
  (s: string | undefined): V | undefined =>
    h[s as K] || (defaultKey && h[defaultKey])

export const hashMapT =
  <P extends Record<string,unknown>, H extends Record<string,Partial<P>> = Record<string,Partial<P>>>(
    h: H,
    defaultKey: keyof H | undefined = undefined,
  ) =>
  (s: string | undefined): H[keyof H] | undefined =>
    h[s as keyof H] || (defaultKey && h[defaultKey])