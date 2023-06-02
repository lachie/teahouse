import { readable } from "svelte/store"

export interface FullyKiosk {
    turnScreenOn(): void
    stopScreensaver(): void
    showToast(m: string): void
    setScreenBrightness(b: number): void

}

class DebugFully implements FullyKiosk {
    turnScreenOn() {
        console.log('turnScreenOn')
    }
    stopScreensaver() {
        console.log('stopScreensaver')
    }
    showToast(m: string) {
        console.log('showToast', m)
    }
    setScreenBrightness(b: number) {
        console.log('setScreenBrightness', b)
    }
}

let fully: FullyKiosk | undefined = new DebugFully()

export const defaultFully = fully
export { fully }