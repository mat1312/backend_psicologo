import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  try {
    // Crea il client Supabase correttamente
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Verifica autenticazione - usa await per la gestione asincrona
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
    console.log("Token trovato per mood-analysis:", session?.access_token ? "Sì" : "No",
                session?.expires_at ? `Scade: ${new Date(session.expires_at * 1000).toLocaleString()}` : "Scadenza non disponibile");

    // Estrai i dati
    const { 
      session_id, 
      analyze_chatbot = true, 
      analyze_elevenlabs = false, 
      elevenlabs_conversation_id = null 
    } = await req.json();
    
    if (!session_id) {
      return NextResponse.json(
        { error: 'ID sessione mancante' },
        { status: 400 }
      );
    }

    // Usa l'URL del backend da variabili d'ambiente
    const backendUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL;

    // Chiama il backend
    const response = await fetch(`${backendUrl}/api/mood-analysis`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({ 
        session_id, 
        analyze_chatbot, 
        analyze_elevenlabs, 
        elevenlabs_conversation_id 
      })
    });
    
    if (!response.ok) {
      // Gestione avanzata degli errori
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        const errorText = await response.text();
        errorData = { detail: errorText };
      }
      
      return NextResponse.json(
        { error: errorData.detail || `Errore del server (${response.status})` }, 
        { status: response.status }
      );
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Errore nell\'analisi dell\'umore:', error);
    return NextResponse.json(
      { error: error.message || 'Errore interno del server' },
      { status: 500 }
    );
  }
}