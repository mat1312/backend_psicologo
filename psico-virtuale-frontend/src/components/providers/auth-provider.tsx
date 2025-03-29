'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/lib/store'
import { supabase } from '@/lib/supabase'

export default function AuthProvider({
  children
}: {
  children: React.ReactNode
}) {
  const { initialize, setUser, setSession } = useAuthStore()

  useEffect(() => {
    // Inizializza lo stato di autenticazione
    initialize()

    // Configura il listener per i cambiamenti della sessione
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session)
        
        if (session?.user?.id) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()
          
          if (profile) {
            setUser({
              id: session.user.id,
              email: session.user.email || '',
              role: profile.role,
              first_name: profile.first_name,
              last_name: profile.last_name
            })
          } else {
            setUser(null)
          }
        } else {
          setUser(null)
        }
      }
    )

    // Pulizia al unmount
    return () => {
      subscription.unsubscribe()
    }
  }, [initialize, setUser, setSession])

  return <>{children}</>
}