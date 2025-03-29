import { create } from 'zustand'
import { supabase } from './supabase'

interface User {
  id: string
  email: string
  role: 'patient' | 'therapist'
  first_name?: string
  last_name?: string
}

interface AuthState {
  user: User | null
  session: any | null
  loading: boolean
  initialized: boolean
  setUser: (user: User | null) => void
  setSession: (session: any | null) => void
  signOut: () => Promise<void>
  initialize: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  loading: true,
  initialized: false,
  setUser: (user) => set({ user }),
  setSession: (session) => set({ session }),
  signOut: async () => {
    await supabase.auth.signOut()
    set({ user: null, session: null })
  },
  initialize: async () => {
    set({ loading: true })
    
    // Ottieni la sessione corrente
    const { data: { session } } = await supabase.auth.getSession()
    set({ session })
    
    if (session?.user?.id) {
      // Ottieni i dettagli del profilo
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()
      
      if (profile) {
        set({ 
          user: {
            id: session.user.id,
            email: session.user.email || '',
            role: profile.role,
            first_name: profile.first_name,
            last_name: profile.last_name
          } 
        })
      }
    }
    
    set({ loading: false, initialized: true })
  }
}))