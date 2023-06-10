// yoinked from fp-ts
function flow<A extends ReadonlyArray<unknown>, B, C>(ab: (...a: A) => B, bc: (b: B) => C): (...a: A) => C
function flow(
    ab: Function,
    bc: Function,
): unknown {
    switch (arguments.length) {
        case 1:
            return ab
        case 2:
            return function (this: unknown) {
                return bc!(ab.apply(this, arguments))
            }
    }
}

export const sineUnit = (v: number) => Math.sin(Math.PI * v)
export const sawUnit = (v: number) => v <= 0.5 ? v * 2 : (1 - v) * 2
export const normalise = (min: number, max: number) => (v: number): number => Math.sign(max - min) * v * Math.abs(max - min) + min
export const sineNorm = (min: number, max: number) => flow(sineUnit, normalise(min, max))
export const sawNorm = (min: number, max: number) => flow(sawUnit, normalise(min, max))