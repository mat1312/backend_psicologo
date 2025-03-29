'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function ChatPage() {
  const { user, loading } = useAuthStore()
  const router = useRouter()
  const [message, setMessage] = useState('')
  const [chatHistory, setChatHistory] = useState<{role: string, content: string}[]>([])
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)

  useEffect(() => {
    // Reindirizza alla pagina di login se l'utente non è autenticato
    if (!loading && !user) {
      router.push('/login')
    }
    
    // Reindirizza alla dashboard se l'utente è un terapeuta
    if (!loading && user?.role === 'therapist') {
      router.push('/dashboard')
    }
    
    // Qui in futuro creeremo o recupereremo una sessione chat
  }, [user, loading, router])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!message.trim()) return
    
    // Aggiungiamo il messaggio dell'utente alla chat
    const newMessage = { role: 'user', content: message }
    setChatHistory(prevHistory => [...prevHistory, newMessage])
    
    // Qui in futuro invieremo il messaggio all'API
    
    // Simuliamo una risposta dell'assistente per ora
    setTimeout(() => {
      setChatHistory(prevHistory => [
        ...prevHistory, 
        { 
          role: 'assistant', 
          content: 'Questa è una risposta di esempio. In futuro qui ci sarà la vera risposta dell\'AI.' 
        }
      ])
    }, 1000)
    
    setMessage('')
  }

  // Mostra il loader mentre verifichiamo l'autenticazione
  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Caricamento...</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Chat con Psicologo Virtuale</h1>
        <Button variant="outline" onClick={() => router.push('/dashboard')}>
          Torna alla dashboard
        </Button>
      </div>
      
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Sessione di supporto</CardTitle>
        </CardHeader>
        <CardContent className="h-[60vh] flex flex-col">
          <div className="flex-grow overflow-y-auto mb-4 space-y-4">
            {chatHistory.length === 0 ? (
              <div className="text-center text-gray-500 mt-10">
                <p>Inizia a parlare con lo psicologo virtuale</p>
              </div>
            ) : (
              chatHistory.map((msg, index) => (
                <div 
                  key={index} 
                  className={`p-3 rounded-lg ${
                    msg.role === 'user' 
                      ? 'bg-blue-100 ml-10' 
                      : 'bg-gray-100 mr-10'
                  }`}
                >
                  <div className="font-semibold mb-1">
                    {msg.role === 'user' ? 'Tu' : 'Psicologo AI'}
                  </div>
                  <div>{msg.content}</div>
                </div>
              ))
            )}
          </div>
          
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Scrivi un messaggio..."
              className="flex-grow"
            />
            <Button type="submit">Invia</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}