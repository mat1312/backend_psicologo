'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [isLogin, setIsLogin] = useState(true)
  const router = useRouter()

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (isLogin) {
        // Login
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) throw error
        
        router.push('/dashboard')
      } else {
        // Registrazione
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              role: 'patient', // Default role
            }
          }
        })

        if (error) throw error

        if (data.user) {
          // Crea il profilo
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: data.user.id,
              email: data.user.email,
              role: 'patient',
            })

          if (profileError) throw profileError

          toast.success("Registrazione completata", {
            description: "Benvenuto/a! Accesso in corso..."
          })
          
          router.push('/dashboard')
        }
      }
    } catch (error: any) {
      toast.error("Errore", {
        description: error.message || "Si è verificato un errore"
      })
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
              : 'Crea un nuovo account paziente'}
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