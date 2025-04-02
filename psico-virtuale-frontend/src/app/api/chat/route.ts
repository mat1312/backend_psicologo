import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  try {
    // 1. Crea il client Supabase correttamente
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // 2. Verifica autenticazione
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Utente non autenticato' }, 
        { status: 401 }
      );
    }

    // 3. Estrai i dati dalla richiesta
    const { query, session_id, mood } = await req.json();
    
    if (!query) {
      return NextResponse.json(
        { error: 'Messaggio mancante' },
        { status: 400 }
      );
    }

    // 4. Chiama il backend FastAPI
    const response = await fetch(`${process.env.BACKEND_URL}/therapy-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({ query, session_id, mood })
    });
    
    // 5. Gestisci errori dal backend
    if (!response.ok) {
      try {
        const errorData = await response.json();
        return NextResponse.json(
          { error: errorData.detail || 'Errore del server' }, 
          { status: response.status }
        );
      } catch (e) {
        // Se non è possibile analizzare la risposta JSON
        return NextResponse.json(
          { error: `Errore del server (${response.status})` }, 
          { status: response.status }
        );
      }
    }
    
    // 6. Restituisci la risposta del backend
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