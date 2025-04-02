// Per verificare se il middleware sta causando problemi, puoi:

// OPZIONE 1: Disabilitare temporaneamente il middleware rinominandolo
// Rinomina src/middleware.ts a src/middleware.ts.bak

// OPZIONE 2: Modificarlo per consentire esplicitamente le pagine dashboard
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  console.log("Middleware executing for path:", req.nextUrl.pathname);
  
  // BYPASS TEMPORANEO: CONSENTI SEMPRE L'ACCESSO ALLE DASHBOARD PER TESTING
  if (req.nextUrl.pathname.startsWith('/patient-dashboard') || 
      req.nextUrl.pathname.startsWith('/therapist-dashboard')) {
    console.log("Permettendo l'accesso diretto alla dashboard per testing");
    return NextResponse.next();
  }
  
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })
  
  // Refresh session if expired
  await supabase.auth.getSession()
  
  // Crea il client Supabase
  try {
    const { data: { session } } = await supabase.auth.getSession()
    console.log("Middleware auth check result:", !!session);

    // Proteggi le rotte /dashboard e /chat
    if ((!session || !session.user) && 
        (req.nextUrl.pathname.startsWith('/dashboard') || 
         req.nextUrl.pathname.startsWith('/chat'))) {
      console.log("Redirigendo a /login da middleware");
      const redirectUrl = new URL('/login', req.url)
      return NextResponse.redirect(redirectUrl)
    }
  } catch (error) {
    console.error('Middleware auth error:', error)
  }

  return res
}

export const config = {
  matcher: [
    '/dashboard/:path*', 
    '/chat/:path*',
    '/patient-dashboard/:path*',
    '/therapist-dashboard/:path*'
  ],
}