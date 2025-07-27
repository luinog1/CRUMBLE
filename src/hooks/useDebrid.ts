import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

type DebridService = 'real-debrid' | 'all-debrid' | 'premiumize';

type DebridState = {
  realDebridApiKey: string
  allDebridApiKey: string
  premiumizeApiKey: string
  setRealDebridApiKey: (key: string) => void
  setAllDebridApiKey: (key: string) => void
  setPremiumizeApiKey: (key: string) => void
  resolveLink: (originalUrl: string) => Promise<{ url: string | null; service?: DebridService }>
  testRealDebridKey: () => Promise<boolean>
  testAllDebridKey: () => Promise<boolean>
  testPremiumizeKey: () => Promise<boolean>
}

export const useDebrid = create<DebridState>()(
  persist(
    (set) => ({
      realDebridApiKey: '',
      allDebridApiKey: '',
      premiumizeApiKey: '',

      setRealDebridApiKey: (key: string) => set({ realDebridApiKey: key }),
      setAllDebridApiKey: (key: string) => set({ allDebridApiKey: key }),
      setPremiumizeApiKey: (key: string) => set({ premiumizeApiKey: key }),

      resolveLink: async (originalUrl: string): Promise<{ url: string | null; service?: 'real-debrid' | 'all-debrid' | 'premiumize' }> => {
        const state = useDebrid.getState()

        try {
          // Try Real-Debrid first
          if (state.realDebridApiKey) {
            const res = await fetch('https://api.real-debrid.com/rest/1.0/unrestrict/link', {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${state.realDebridApiKey}`,
                'Content-Type': 'application/x-www-form-urlencoded',
              },
              body: `link=${encodeURIComponent(originalUrl)}`,
            })

            if (res.ok) {
              const json = await res.json()
              if (json.download) return { url: json.download, service: 'real-debrid' }
            }
          }

          // Try All-Debrid second
          if (state.allDebridApiKey) {
            const res = await fetch(
              `https://api.alldebrid.com/v4/link/unlock?agent=crumble&apikey=${state.allDebridApiKey}&link=${encodeURIComponent(originalUrl)}`
            )

            if (res.ok) {
              const json = await res.json()
              if (json.data?.link) return { url: json.data.link, service: 'all-debrid' }
            }
          }

          // Try Premiumize last
          if (state.premiumizeApiKey) {
            const res = await fetch(
              `https://www.premiumize.me/api/transfer/directdl?apikey=${state.premiumizeApiKey}&src=${encodeURIComponent(originalUrl)}`
            )

            if (res.ok) {
              const json = await res.json()
              if (json.location) return { url: json.location, service: 'premiumize' }
            }
          }

          return { url: null }
        } catch (error) {
          console.error('Error resolving debrid link:', error)
          return { url: null }
        }
      },

      testRealDebridKey: async (): Promise<boolean> => {
        const state = useDebrid.getState()
        if (!state.realDebridApiKey) return false

        try {
          const res: Response = await fetch('https://api.real-debrid.com/rest/1.0/user', {
            headers: {
              Authorization: `Bearer ${state.realDebridApiKey}`,
            },
          })
          return res.ok
        } catch {
          return false
        }
      },

      testAllDebridKey: async (): Promise<boolean> => {
        const state = useDebrid.getState()
        if (!state.allDebridApiKey) return false

        try {
          const res: Response = await fetch(
            `https://api.alldebrid.com/v4/user?agent=crumble&apikey=${state.allDebridApiKey}`
          )
          const json: { status: string } = await res.json()
          return json.status === 'success'
        } catch {
          return false
        }
      },

      testPremiumizeKey: async (): Promise<boolean> => {
        const state = useDebrid.getState()
        if (!state.premiumizeApiKey) return false

        try {
          const res: Response = await fetch(
            `https://www.premiumize.me/api/account/info?apikey=${state.premiumizeApiKey}`
          )
          const json: { status: string } = await res.json()
          return json.status === 'success'
        } catch {
          return false
        }
      },
    }),
    {
      name: 'debrid-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        realDebridApiKey: state.realDebridApiKey,
        allDebridApiKey: state.allDebridApiKey,
        premiumizeApiKey: state.premiumizeApiKey,
      }),
    }
  )
)