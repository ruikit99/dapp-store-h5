import { create } from 'zustand'
import { setStored } from '@/lib/browserStorage'

interface WalletState {
  wallet: Record<string, any> | null
  walletAddress: string
  isConnect: boolean
  netValue: Record<string, any>
  netAssign: string
  setWallet: (data: Record<string, any> | null) => void
  setWalletAddress: (v: string) => void
  setIsConnect: (v: boolean) => void
  setNetValue: (v: Record<string, any>) => void
  setNetAssign: (v: string) => void
  setNetAssignValue: (v: string) => void
}

export const useWalletStore = create<WalletState>((set) => ({
  wallet: null,
  walletAddress: '',
  isConnect: false,
  netValue: {},
  netAssign: '',
  setWallet: (data) => set({ wallet: data ? { ...data } : null }),
  setWalletAddress: (v) => set({ walletAddress: v }),
  setIsConnect: (v) => {
    set({ isConnect: v })
    setStored('connect', String(!!v))
  },
  setNetValue: (v) => set({ netValue: v }),
  setNetAssign: (v) => set({ netAssign: v }),
  setNetAssignValue: (v) => set({ netAssign: v }),
}))
