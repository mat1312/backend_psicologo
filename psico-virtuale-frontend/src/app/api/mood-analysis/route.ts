import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
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

    // Chiama il backend
    const response = await fetch(`${process.env.BACKEND_URL}/api/mood-analysis`, {
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
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.detail || 'Errore del server' }, 
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