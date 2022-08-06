import { flow } from "fp-ts/lib/function"

export const sineUnit = (v: number) => Math.sin(Math.PI * v)
export const sawUnit = (v: number) => v <= 0.5 ? v*2 : 1-(v*2)
export const normalise = (min: number, max: number) => (v:number): number => Math.sign(max - min) * v * Math.abs(max - min) + min
export const sineNorm = (min: number, max: number) => flow(sineUnit, normalise(min, max))
export const sawNorm = (min: number, max: number) => flow(sawUnit, normalise(min, max))