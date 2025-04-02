import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  try {
    // Verifica autenticazione - correzione inizializzazione Supabase
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Utente non autenticato' }, 
        { status: 401 }
      );
    }

    // Verifica che l'utente sia un terapeuta (opzionale)
    // Se vuoi limitare questo endpoint solo ai terapeuti, puoi aggiungere questo controllo
    const { data: profileData } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();
      
    if (profileData?.role !== 'therapist') {
      return NextResponse.json(
        { error: 'Accesso negato: questa funzionalità è riservata ai terapeuti' },
        { status: 403 }
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
    const response = await fetch(`${process.env.BACKEND_URL}/api/pathology-analysis`, {
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
    console.error('Errore nell\'analisi delle patologie:', error);
    return NextResponse.json(
      { error: error.message || 'Errore interno del server' },
      { status: 500 }
    );
  }
}