import { DependencyList, useEffect } from "react"

export interface FullyKiosk {
    turnScreenOn(): void
    stopScreensaver(): void
    showToast(m: string): void
    setScreenBrightness(b: number): void

}
declare global {
    const fully: FullyKiosk | undefined
}

export const useFullyKiosk = (cb: (fully: FullyKiosk) => void, deps?: DependencyList) => {
    useEffect(() => {
        if (typeof FullyKiosk !== 'undefined') {
            cb(fully as FullyKiosk)
        }
    }, deps)
}