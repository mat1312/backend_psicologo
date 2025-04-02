import { create } from 'zustand'
import { supabase, supabaseUrl, supabaseAnonKey } from './supabase'

interface User {
  id: string
  email: string
  role: 'patient' | 'therapist'
  first_name?: string
  last_name?: string
  avatar_url?: string
  created_at?: string
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
    set({ loading: true });
    console.log("Inizializzazione auth store...");
    
    try {
      // 1. Ottieni la sessione
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Errore nel recupero della sessione:', sessionError);
        set({ loading: false, initialized: true });
        return;
      }
      
      if (!session) {
        console.log('Nessuna sessione attiva');
        set({ loading: false, initialized: true });
        return;
      }
      
      set({ session });
      console.log('Sessione trovata per:', session.user.id);
      
      if (session?.user?.id) {
        try {
          // 2. Approccio semplificato: una sola query per il profilo
          console.log('Recupero profilo...');
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
            
          if (error) {
            console.error('Errore nel recupero del profilo:', error);
            // Fallback: crea un profilo base con i dati della sessione
            const defaultRole = session.user.user_metadata?.role || 'patient';
            
            set({
              user: {
                id: session.user.id,
                email: session.user.email || '',
                role: defaultRole,
                first_name: session.user.user_metadata?.first_name,
                last_name: session.user.user_metadata?.last_name
              }
            });
            
            console.log('Profilo di fallback creato con ruolo:', defaultRole);
            
            // Opzionalmente, tenta di creare il profilo in background
            try {
              const newProfile = {
                id: session.user.id,
                email: session.user.email || '',
                role: defaultRole
              };
              
              await supabase
                .from('profiles')
                .insert(newProfile);
                
              console.log('Profilo creato con successo');
            } catch (insertError) {
              console.error('Errore nella creazione del profilo:', insertError);
            }
          } else if (profile) {
            // Profilo trovato con successo
            set({ 
              user: {
                id: session.user.id,
                email: session.user.email || '',
                role: profile.role,
                first_name: profile.first_name,
                last_name: profile.last_name
              } 
            });
            console.log('Profilo caricato con ruolo:', profile.role);
          }
        } catch (error) {
          console.error('Errore imprevisto nel recupero/creazione profilo:', error);
          // Fallback minimo in caso di errore
          set({
            user: {
              id: session.user.id,
              email: session.user.email || '',
              role: 'patient'
            }
          });
        }
      }
    } catch (error) {
      console.error('Errore generale durante l\'inizializzazione:', error);
    } finally {
      console.log('Inizializzazione completata');
      set({ loading: false, initialized: true });
    }
  }
}))