'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function DashboardPage() {
  const { user, loading, signOut } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    // Reindirizza alla pagina di login se l'utente non è autenticato
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  // Mostra il loader mentre verifichiamo l'autenticazione
  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Caricamento...</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">
          {user.role === 'therapist' ? 'Dashboard Terapeuta' : 'Dashboard Paziente'}
        </h1>
        <Button variant="outline" onClick={signOut}>Logout</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Profilo</CardTitle>
            <CardDescription>I tuoi dati personali</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-2"><strong>Email:</strong> {user.email}</p>
            <p className="mb-2"><strong>Ruolo:</strong> {user.role === 'therapist' ? 'Terapeuta' : 'Paziente'}</p>
            {user.first_name && (
              <p className="mb-2"><strong>Nome:</strong> {user.first_name} {user.last_name}</p>
            )}
          </CardContent>
        </Card>

        {user.role === 'patient' && (
          <Card className="cursor-pointer hover:shadow-md transition-shadow" 
                onClick={() => router.push('/chat')}>
            <CardHeader>
              <CardTitle>Chat con Psicologo Virtuale</CardTitle>
              <CardDescription>Inizia una nuova sessione</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Parla con il nostro assistente AI per supporto psicologico immediato.</p>
            </CardContent>
          </Card>
        )}

        {user.role === 'therapist' && (
          <Card>
            <CardHeader>
              <CardTitle>I tuoi pazienti</CardTitle>
              <CardDescription>Lista dei pazienti assegnati</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Qui verranno mostrati i pazienti assegnati a te.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}