import { create } from 'zustand'

interface UIState {
  commandPaletteOpen: boolean
  setCommandPaletteOpen: (value: boolean) => void
}

export const useUIStore = create<UIState>((set) => ({
  commandPaletteOpen: false,
  setCommandPaletteOpen: (commandPaletteOpen) => set({ commandPaletteOpen }),
}))
