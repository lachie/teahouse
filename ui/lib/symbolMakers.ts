
export const symOr = (s: string) => (x?: unknown): string | null => x === undefined ? null : `${x}${s}`
export const degSym = symOr('°')
export const pcSym = symOr('%')