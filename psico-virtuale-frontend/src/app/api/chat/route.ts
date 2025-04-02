import { NextRequest, NextResponse } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';

export async function POST(req: NextRequest) {
  try {
    // 1. Crea una risposta vuota che poi modificheremo
    const res = NextResponse.next();
    
    // 2. Usa il middleware client che è progettato per funzionare con Next.js
    const supabase = createMiddlewareClient({ req, res });
    
    // 3. Recupera la sessione
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error("Errore nel recupero della sessione:", sessionError);
      return NextResponse.json(
        { error: `Errore di autenticazione: ${sessionError.message}` }, 
        { status: 401 }
      );
    }
    
    if (!session) {
      console.error("Nessuna sessione attiva trovata");
      return NextResponse.json(
        { error: 'Utente non autenticato' }, 
        { status: 401 }
      );
    }

    // Log per debug - Corretto per gestire expires_at undefined
    console.log("Token trovato per chat:", session?.access_token ? "Sì" : "No",
                session?.expires_at ? `Scade: ${new Date(session.expires_at * 1000).toLocaleString()}` : "Scadenza non disponibile");

    // 4. Estrai i dati dalla richiesta
    const { query, session_id, mood } = await req.json();
    
    if (!query) {
      return NextResponse.json(
        { error: 'Messaggio mancante' },
        { status: 400 }
      );
    }

    // Usa l'URL del backend da variabili d'ambiente
    const backendUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL;

    // 5. Chiama il backend FastAPI
    const response = await fetch(`${backendUrl}/therapy-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({ query, session_id, mood })
    });
    
    // 6. Gestione avanzata degli errori dal backend
    if (!response.ok) {
      try {
        const errorData = await response.json();
        
        // Se è un errore di autenticazione, restituisci un errore 401
        if (response.status === 401) {
          return NextResponse.json(
            { error: 'Utente non autenticato o sessione scaduta' }, 
            { status: 401 }
          );
        }
        
        return NextResponse.json(
          { error: errorData.detail || 'Errore del server' }, 
          { status: response.status }
        );
      } catch (e) {
        // Se non è possibile analizzare la risposta JSON
        const errorText = await response.text();
        return NextResponse.json(
          { error: `Errore del server (${response.status}): ${errorText}` }, 
          { status: response.status }
        );
      }
    }
    
    // 7. Restituisci la risposta del backend
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Errore nella gestione della richiesta chat:', error);
    return NextResponse.json(
      { error: error.message || 'Errore interno del server' },
      { status: 500 }
    );
  }
}