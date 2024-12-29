import { create } from 'zustand'

interface ProximityState {
  isNearDestination: boolean
  setIsNearDestination: (value: boolean) => void
  transactionId: string | null
  setTransactionId: (id: string | null) => void
}

export const useProximityStore = create<ProximityState>((set) => ({
  isNearDestination: false,
  setIsNearDestination: (value) => set({ isNearDestination: value }),
  transactionId: null,
  setTransactionId: (id) => set({ transactionId: id }),
}))