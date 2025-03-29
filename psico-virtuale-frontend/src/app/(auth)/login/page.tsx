'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/lib/store'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('patient') // Default ruolo: paziente
  const [loading, setLoading] = useState(false)
  const [isLogin, setIsLogin] = useState(true)
  const router = useRouter()
  const { initialize, user } = useAuthStore()

  useEffect(() => {
    // Controlla se l'utente è già autenticato
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        // Inizializza lo store per assicurarsi che user sia impostato
        await initialize()
        router.replace('/dashboard')
      }
    }
    
    checkSession()
  }, [router, initialize])

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email || !password) {
      toast.error("Errore", { description: "Email e password sono richiesti" })
      return
    }
    
    setLoading(true)

    try {
      if (isLogin) {
        // Login
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) throw error
        
        toast.success("Accesso effettuato")
        
        // Inizializza lo store prima di reindirizzare
        await initialize()
        
        // Aggiungiamo un piccolo ritardo per assicurarci che lo stato sia aggiornato
        setTimeout(() => {
          // Utilizziamo router.replace invece di push per una sostituzione completa
          router.replace('/dashboard')
        }, 300)
      } else {
        // Registrazione
        // Prima registriamo l'utente in auth
        const { data, error } = await supabase.auth.signUp({
          email,
          password
        })

        if (error) throw error

        if (data?.user?.id) {
          try {
            console.log("Creazione profilo per:", data.user.id, email, role)
            
            // Attendi un breve momento per assicurarsi che l'utente sia creato
            await new Promise(resolve => setTimeout(resolve, 500))
            
            // Creazione profilo
            const { error: profileError } = await supabase
              .from('profiles')
              .insert({
                id: data.user.id,
                email: email,
                role: role
              })

            if (profileError) {
              console.error("Errore dettagliato creazione profilo:", JSON.stringify(profileError))
              throw profileError
            }

            toast.success(`Registrazione completata come ${role === 'therapist' ? 'psicologo' : 'paziente'}`)
            
            // Inizializza lo store prima di reindirizzare
            await initialize()
            
            // Utilizziamo router.replace con un piccolo ritardo
            setTimeout(() => {
              router.replace('/dashboard')
            }, 300)
          } catch (profileError: any) {
            console.error("Errore dettagliato:", JSON.stringify(profileError))
            toast.error("Errore nella creazione del profilo", {
              description: profileError?.message || "Controlla la console per dettagli"
            })
          }
        }
      }
    } catch (error: any) {
      console.error("Errore di autenticazione:", JSON.stringify(error))
      
      // Messaggi di errore più leggibili
      let errorMessage = "Si è verificato un errore"
      
      if (error.message?.includes("credentials")) {
        errorMessage = "Email o password non corretti"
      } else if (error.message?.includes("confirm")) {
        errorMessage = "Controlla la tua email per confermare la registrazione"
      } else if (error.message?.includes("already") || error.message?.includes("esistente")) {
        errorMessage = "Email già registrata. Prova ad effettuare l'accesso"
      } else {
        errorMessage = error.message || "Errore sconosciuto"
      }
      
      toast.error("Errore", { description: errorMessage })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{isLogin ? 'Accedi' : 'Registrati'}</CardTitle>
          <CardDescription>
            {isLogin 
              ? 'Inserisci le tue credenziali per accedere' 
              : 'Crea un nuovo account'}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleAuth}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">Email</label>
              <Input
                id="email"
                type="email"
                placeholder="nome@esempio.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">Password</label>
              <Input
                id="password"
                type="password"
                placeholder="********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            
            {/* Selezione ruolo (visibile solo durante la registrazione) */}
            {!isLogin && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Tipo di account</label>
                <RadioGroup 
                  value={role} 
                  onValueChange={setRole} 
                  className="flex flex-col space-y-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="patient" id="patient" />
                    <Label htmlFor="patient">Paziente</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="therapist" id="therapist" />
                    <Label htmlFor="therapist">Psicologo/Terapeuta</Label>
                  </div>
                </RadioGroup>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading}
            >
              {loading 
                ? 'Caricamento...' 
                : (isLogin ? 'Accedi' : 'Registrati')}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin
                ? 'Non hai un account? Registrati'
                : 'Hai già un account? Accedi'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}