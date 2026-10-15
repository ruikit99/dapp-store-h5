import { Buffer } from 'buffer'

;(globalThis as any).Buffer = (globalThis as any).Buffer || Buffer
if (typeof (globalThis as any).global === 'undefined') {
  ;(globalThis as any).global = globalThis
}
