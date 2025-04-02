import { createClient } from '@supabase/supabase-js';

// Esportiamo le variabili separatamente per poterle usare anche in altri file
export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Configurazione ottimizzata del client Supabase per il browser
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
  },
  global: {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Client-Info': 'supabase-js/2.x'
    },
  },
});