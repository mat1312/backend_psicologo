import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(
  req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    // Verifica autenticazione
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Utente non autenticato' }, 
        { status: 401 }
      );
    }

    // Controlla che sessionId sia presente
    const sessionId = params.sessionId;
    if (!sessionId) {
      return NextResponse.json(
        { error: 'ID sessione mancante' },
        { status: 400 }
      );
    }

    // Chiama il backend
    const response = await fetch(`${process.env.BACKEND_URL}/api/session-summary/${sessionId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${session.access_token}`
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.detail || 'Errore del server' }, 
        { status: response.status }
      );
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Errore nel recupero del riepilogo della sessione:', error);
    return NextResponse.json(
      { error: error.message || 'Errore interno del server' },
      { status: 500 }
    );
  }
}