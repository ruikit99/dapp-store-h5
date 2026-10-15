/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE: string
  readonly VITE_PROXY_DAPP?: string
  readonly VITE_PROXY_WALLET?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

interface Window {
  ethereum?: any
  solana?: any
  tronWeb?: any
  safepalConnector?: { postMessage: (msg: string) => void }
  safepalConnectorH5?: any
  safepalwallet?: { postMessage?: ((object: unknown) => void) | null }
  ethereumAddress?: string
}
