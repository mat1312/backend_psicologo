// src/app/api/recommend-resources/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  try {
    // Ottieni i dati della richiesta prima
    const data = await req.json();
    const { query, session_id } = data;
    
    if (!session_id) {
      return NextResponse.json(
        { error: 'ID sessione mancante' },
        { status: 400 }
      );
    }

    // Inizializza Supabase correttamente
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Usa await per la gestione asincrona dei cookies
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
    console.log("Token trovato per recommend-resources:", session?.access_token ? "Sì" : "No", 
                session?.expires_at ? `Scade: ${new Date(session.expires_at * 1000).toLocaleString()}` : "Scadenza non disponibile");
    
    // Usa l'URL del backend da variabili d'ambiente
    const backendUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL;
    
    // Chiama il backend
    const response = await fetch(`${backendUrl}/api/recommend-resources`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({ query, session_id })
    });
    
    if (!response.ok) {
      // Gestione avanzata degli errori
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        // Se non è possibile decodificare JSON, utilizza il testo
        const errorText = await response.text();
        errorData = { detail: errorText };
      }
      
      console.error("Errore dal backend:", response.status, errorData);
      
      return NextResponse.json(
        { error: errorData.detail || `Errore del server (${response.status})` }, 
        { status: response.status }
      );
    }
    
    const responseData = await response.json();
    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error('Errore nel recupero delle risorse consigliate:', error);
    return NextResponse.json(
      { error: error.message || 'Errore interno del server' },
      { status: 500 }
    );
  }
}