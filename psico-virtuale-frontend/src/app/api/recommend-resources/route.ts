// src/app/api/recommend-resources/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    // Ottieni i dati della richiesta
    const data = await req.json();
    const { query, session_id } = data;
    
    if (!session_id) {
      return NextResponse.json(
        { error: 'ID sessione mancante' },
        { status: 400 }
      );
    }

    // Estrai l'Authorization header direttamente dalla request
    const authorization = req.headers.get('Authorization');
    
    if (!authorization) {
      console.error("Nessun token di autorizzazione trovato");
      return NextResponse.json(
        { error: 'Token di autenticazione mancante' }, 
        { status: 401 }
      );
    }

    // Usa l'URL del backend da variabili d'ambiente
    const backendUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL;
    
    // Passa semplicemente l'auth header al backend
    const response = await fetch(`${backendUrl}/api/recommend-resources`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authorization // Usa lo stesso header
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
      
      // Se è un errore di autenticazione, restituisci un errore 401
      if (response.status === 401) {
        return NextResponse.json(
          { error: 'Utente non autenticato o sessione scaduta' }, 
          { status: 401 }
        );
      }
      
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