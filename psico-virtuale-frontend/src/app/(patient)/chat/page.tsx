// src/app/(patient)/chat/page.tsx (aggiornato)
'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { apiClient, ChatMessage } from '@/lib/apiClient'
import { MoodSelector } from '@/components/MoodSelector'
import { toast } from 'sonner'
import { v4 as uuidv4 } from 'uuid'
import { 
  SmileIcon, 
  VolumeIcon, 
  BookOpenIcon, 
  RefreshCwIcon,
  PlusCircleIcon
} from 'lucide-react'

export default function ChatPage() {
  const { user, loading } = useAuthStore()
  const router = useRouter()
  const [message, setMessage] = useState('')
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([])
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [showMoodSelector, setShowMoodSelector] = useState(false)
  const [currentMood, setCurrentMood] = useState<string | null>(null)
  const [showResources, setShowResources] = useState(false)
  const [resources, setResources] = useState<Array<{title: string, description: string, type: string}>>([])
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)

  // Inizializzazione
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
    
    if (!loading && user?.role === 'therapist') {
      router.push('/dashboard')
    }
    
    // Inizializza l'ID sessione o carica quello salvato
    if (!currentSessionId) {
      const savedSessionId = localStorage.getItem('current_chat_session_id')
      if (savedSessionId) {
        setCurrentSessionId(savedSessionId)
        // Opzionale: caricare la storia della chat dalla sessione salvata
        // loadChatHistory(savedSessionId)
      } else {
        const newSessionId = uuidv4()
        setCurrentSessionId(newSessionId)
        localStorage.setItem('current_chat_session_id', newSessionId)
      }
    }
    
    // Suggerisci di selezionare l'umore all'avvio
    if (!currentMood && !showMoodSelector && !loading && user) {
      setTimeout(() => setShowMoodSelector(true), 1000)
    }
  }, [user, loading, router, currentSessionId, currentMood, showMoodSelector])

  // Scroll alla fine della chat quando arrivano nuovi messaggi
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [chatHistory])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!message.trim() || !currentSessionId || isProcessing) return
    
    // Aggiungiamo il messaggio dell'utente alla chat
    const newMessage: ChatMessage = { role: 'user', content: message }
    setChatHistory(prev => [...prev, newMessage])
    
    // Pulisci l'input e imposta stato di caricamento
    setMessage('')
    setIsProcessing(true)
    
    try {
      // Invia il messaggio all'API e attendi la risposta
      const response = await apiClient.sendMessage(
        message, 
        currentSessionId,
        currentMood || undefined
      )
      
      // Aggiungi la risposta dell'assistente alla chat
      const assistantMessage: ChatMessage = {
        role: 'assistant', 
        content: response.answer
      }
      
      setChatHistory(prev => [...prev, assistantMessage])
      
      // Opzionale: se c'è un audio_url nella risposta, riproducilo
      if (response.audio_url && audioRef.current) {
        audioRef.current.src = response.audio_url
        audioRef.current.play().catch(err => {
          console.error('Errore nella riproduzione audio:', err)
        })
      }
      
      // Dopo alcune interazioni, suggerisci risorse
      if (chatHistory.length > 4 && Math.random() > 0.7) {
        fetchResourceRecommendations()
      }
    } catch (error) {
      console.error('Errore durante l\'invio del messaggio:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleResetChat = async () => {
    if (!currentSessionId) return
    
    try {
      await apiClient.resetSession(currentSessionId)
      setChatHistory([])
      setShowResources(false)
      setResources([])
      setCurrentMood(null)
      
      // Genera un nuovo ID sessione
      const newSessionId = uuidv4()
      setCurrentSessionId(newSessionId)
      localStorage.setItem('current_chat_session_id', newSessionId)
      
      toast.success('Conversazione resettata con successo')
    } catch (error) {
      console.error('Errore durante il reset della chat:', error)
    }
  }

  const handleMoodSelection = (mood: string) => {
    setCurrentMood(mood)
    toast.success(`Umore registrato: ${mood}`)
  }

  const fetchResourceRecommendations = async () => {
    if (!currentSessionId) return
    
    try {
      const response = await apiClient.getResourceRecommendations(
        "", // Vuoto perché il backend analizzerà tutta la conversazione
        currentSessionId
      )
      
      if (response.resources && response.resources.length > 0) {
        setResources(response.resources)
        setShowResources(true)
      }
    } catch (error) {
      console.error('Errore nel recupero delle risorse consigliate:', error)
    }
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
      {/* Audio player nascosto per riproduzione vocale */}
      <audio ref={audioRef} className="hidden" />
      
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Chat con Psicologo Virtuale</h1>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setShowMoodSelector(true)}
            className="flex items-center"
          >
            <SmileIcon className="h-4 w-4 mr-2" />
            Registra umore
          </Button>
          <Button 
            variant="outline" 
            onClick={handleResetChat}
            className="flex items-center"
          >
            <RefreshCwIcon className="h-4 w-4 mr-2" />
            Nuova Conversazione
          </Button>
          <Button 
            variant="outline" 
            onClick={() => router.push('/dashboard')}
          >
            Torna alla dashboard
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="mb-4 md:col-span-3">
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <span>Sessione di supporto</span>
              {currentMood && (
                <span className="text-sm font-normal px-3 py-1 bg-gray-100 rounded-full">
                  Umore: {currentMood}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[60vh] flex flex-col">
            <div 
              ref={chatContainerRef}
              className="flex-grow overflow-y-auto mb-4 space-y-4"
            >
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
                    <div className="font-semibold mb-1 flex justify-between">
                      <span>{msg.role === 'user' ? 'Tu' : 'Psicologo AI'}</span>
                      {msg.role === 'assistant' && (
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-6 w-6 p-0"
                          onClick={() => {
                            // Qui potresti implementare la riproduzione vocale usando TTS
                            // Per ora è solo un placeholder
                            toast.info('Funzionalità vocale in arrivo')
                          }}
                        >
                          <VolumeIcon className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <div>{msg.content}</div>
                  </div>
                ))
              )}
              
              {isProcessing && (
                <div className="bg-gray-100 mr-10 p-3 rounded-lg">
                  <div className="font-semibold mb-1">Psicologo AI</div>
                  <div className="flex items-center">
                    <span className="animate-pulse">Sto pensando</span>
                    <span className="animate-pulse ml-1">...</span>
                  </div>
                </div>
              )}
            </div>
            
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Scrivi un messaggio..."
                disabled={isProcessing}
                className="flex-grow"
              />
              <Button 
                type="submit" 
                disabled={isProcessing || !message.trim()}
              >
                Invia
              </Button>
            </form>
          </CardContent>
        </Card>
        
        {/* Pannello risorse consigliate */}
        <Card className={`${showResources ? 'block' : 'hidden'} md:block`}>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <BookOpenIcon className="h-5 w-5 mr-2" />
              Risorse Consigliate
            </CardTitle>
          </CardHeader>
          <CardContent className="max-h-[60vh] overflow-y-auto">
            {resources.length > 0 ? (
              <div className="space-y-4">
                {resources.map((resource, index) => (
                  <div key={index} className="border-b pb-3">
                    <h4 className="font-medium">{resource.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{resource.description}</p>
                    <span className="inline-block mt-2 text-xs px-2 py-1 bg-gray-100 rounded-full">
                      {resource.type}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                Continua la conversazione per ricevere risorse personalizzate.
              </p>
            )}
          </CardContent>
          <CardFooter>
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full text-sm"
              onClick={fetchResourceRecommendations}
            >
              <PlusCircleIcon className="h-4 w-4 mr-2" />
              Aggiorna risorse
            </Button>
          </CardFooter>
        </Card>
      </div>
      
      {/* Modal per selezione umore */}
      {showMoodSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center z-50">
          <div className="max-w-md w-full">
            <MoodSelector 
              onSelect={handleMoodSelection}
              onClose={() => setShowMoodSelector(false)}
            />
          </div>
        </div>
      )}
    </div>
  )
}