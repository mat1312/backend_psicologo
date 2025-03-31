import { create } from 'zustand'
import { supabase, supabaseUrl, supabaseAnonKey } from './supabase'

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
    
    try {
      // Ottieni la sessione corrente
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        console.error('Errore nel recupero della sessione:', sessionError)
        set({ loading: false, initialized: true })
        return
      }
      
      set({ session })
      
      if (session?.user?.id) {
        try {
          // Metodo 1: Recupera il profilo utilizzando una query diretta
          let profile = null;
          
          try {
            // Utilizziamo un metodo POST invece di GET (elimina il problema 406)
            const { data, error } = await supabase.rpc('get_profile', {
              user_id: session.user.id
            });
            
            if (!error && data) {
              profile = data;
            }
          } catch (rpcError) {
            console.log('RPC non disponibile, utilizzo metodo alternativo');
          }
          
          // Metodo 2: Se RPC fallisce, usando l'SDK standard
          if (!profile) {
            const { data, error } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .maybeSingle();
              
            if (!error && data) {
              profile = data;
            } else {
              console.log('Errore query standard:', error);
            }
          }
          
          // Metodo 3: Ultimo tentativo con fetch diretto
          if (!profile) {
            try {
              const token = session.access_token;
              const response = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${encodeURIComponent(session.user.id)}&select=*`, {
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`,
                  'apikey': supabaseAnonKey,
                  'Accept': 'application/json',
                }
              });
              
              if (response.ok) {
                const data = await response.json();
                if (Array.isArray(data) && data.length > 0) {
                  profile = data[0];
                }
              } else {
                console.log('Fetch diretto fallito:', response.status);
              }
            } catch (fetchError) {
              console.error('Errore fetch diretto:', fetchError);
            }
          }
          
          // Metodo 4: Utilizza i metadati dell'utente come fallback
          if (!profile) {
            const userMetadata = session.user.user_metadata || {};
            const userRole = userMetadata.role || 'patient'; // Default a patient
            
            profile = {
              id: session.user.id,
              email: session.user.email,
              role: userRole,
              first_name: userMetadata.first_name,
              last_name: userMetadata.last_name
            };
            
            // Tenta di creare il profilo se non esiste
            try {
              const { error: insertError } = await supabase
                .from('profiles')
                .insert(profile);
                
              if (insertError) {
                console.error('Tentativo di creazione profilo fallito:', insertError);
              } else {
                console.log('Profilo creato con successo');
              }
            } catch (insertError) {
              console.error('Errore creazione profilo:', insertError);
            }
          }
          
          // Se abbiamo trovato o creato un profilo, aggiorniamo lo stato
          if (profile) {
            set({ 
              user: {
                id: session.user.id,
                email: session.user.email || '',
                role: profile.role,
                first_name: profile.first_name,
                last_name: profile.last_name
              } 
            });
          } else {
            // Fallback totale: creare un profilo di emergenza basato sui dati di sessione
            set({
              user: {
                id: session.user.id,
                email: session.user.email || '',
                role: 'patient', // Ruolo di default
                first_name: undefined,
                last_name: undefined
              }
            });
            console.warn('Impossibile recuperare o creare un profilo, utilizzando dati di emergenza');
          }
        } catch (error) {
          console.error('Errore inaspettato nel recupero del profilo:', error);
          // Fallback con i dati disponibili nella sessione
          set({
            user: {
              id: session.user.id,
              email: session.user.email || '',
              role: 'patient', // Ruolo di default
              first_name: undefined,
              last_name: undefined
            }
          });
        }
      }
    } catch (error) {
      console.error('Errore durante l\'inizializzazione dell\'autenticazione:', error);
    } finally {
      set({ loading: false, initialized: true });
    }
  }
}))