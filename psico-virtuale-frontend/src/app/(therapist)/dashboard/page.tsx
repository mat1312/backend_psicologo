// src/app/(dashboard)/dashboard/therapist/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { apiClient } from '@/lib/apiClient'
import { toast } from 'sonner'
import { 
  Users, 
  BarChart4, 
  BrainCircuit,
  Microscope
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

// Interfaccia per i dati del paziente
interface Patient {
  id: string
  email: string
  first_name?: string
  last_name?: string
  created_at: string
  sessions?: Array<{
    id: string
    created_at: string
    last_updated: string
    title?: string
  }>
}

export default function TherapistDashboardPage() {
  const { user, loading } = useAuthStore()
  const router = useRouter()
  const [patients, setPatients] = useState<Patient[]>([])
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [selectedSession, setSelectedSession] = useState<string | null>(null)
  const [sessionSummary, setSessionSummary] = useState<string>('')
  const [moodAnalysis, setMoodAnalysis] = useState<string>('')
  const [pathologyAnalysis, setPathologyAnalysis] = useState<any>(null)
  const [isLoading, setIsLoading] = useState({
    patients: false,
    summary: false,
    mood: false,
    pathology: false
  })

  useEffect(() => {
    // Reindirizza se l'utente non è autenticato o non è un terapeuta
    if (!loading) {
      if (!user) {
        router.push('/login')
      } else if (user.role !== 'therapist') {
        router.push('/dashboard')
      } else {
        // Carica i pazienti
        fetchPatients()
      }
    }
  }, [user, loading, router])

  const fetchPatients = async () => {
    setIsLoading(prev => ({ ...prev, patients: true }))
    try {
      // Ottieni i pazienti dal database
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'patient')
      
      if (error) throw error
      
      // Ottieni le sessioni per ogni paziente
      const patientsWithSessions = await Promise.all(
        data.map(async (patient) => {
          const { data: sessions, error: sessionsError } = await supabase
            .from('chat_sessions')
            .select('*')
            .eq('patient_id', patient.id)
            .order('last_updated', { ascending: false })
          
          return {
            ...patient,
            sessions: sessionsError ? [] : sessions
          }
        })
      )
      
      setPatients(patientsWithSessions)
    } catch (error) {
      console.error('Errore nel recupero dei pazienti:', error)
      toast.error('Errore', { description: 'Impossibile recuperare i pazienti' })
    } finally {
      setIsLoading(prev => ({ ...prev, patients: false }))
    }
  }

  const fetchSessionSummary = async (sessionId: string) => {
    setIsLoading(prev => ({ ...prev, summary: true }))
    try {
      const response = await apiClient.getSessionSummary(sessionId)
      setSessionSummary(response.summary_html)
    } catch (error) {
      console.error('Errore nel recupero del riepilogo della sessione:', error)
      toast.error('Errore', { description: 'Impossibile recuperare il riepilogo della sessione' })
    } finally {
      setIsLoading(prev => ({ ...prev, summary: false }))
    }
  }

  const fetchMoodAnalysis = async (sessionId: string) => {
    setIsLoading(prev => ({ ...prev, mood: true }))
    try {
      const response = await apiClient.getMoodAnalysis(sessionId)
      setMoodAnalysis(response.mood_analysis)
    } catch (error) {
      console.error('Errore nell\'analisi dell\'umore:', error)
      toast.error('Errore', { description: 'Impossibile recuperare l\'analisi dell\'umore' })
    } finally {
      setIsLoading(prev => ({ ...prev, mood: false }))
    }
  }

  const fetchPathologyAnalysis = async (sessionId: string) => {
    setIsLoading(prev => ({ ...prev, pathology: true }))
    try {
      const response = await apiClient.getPathologyAnalysis(sessionId)
      setPathologyAnalysis(response)
    } catch (error) {
      console.error('Errore nell\'analisi delle patologie:', error)
      toast.error('Errore', { description: 'Impossibile recuperare l\'analisi delle patologie' })
    } finally {
      setIsLoading(prev => ({ ...prev, pathology: false }))
    }
  }

  const handleSelectSession = (sessionId: string) => {
    setSelectedSession(sessionId)
    // Carica i dati della sessione
    fetchSessionSummary(sessionId)
    fetchMoodAnalysis(sessionId)
    fetchPathologyAnalysis(sessionId)
  }

  // Mostra il loader mentre verifichiamo l'autenticazione
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Caricamento...</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Dashboard Terapeuta</h1>
        <Button variant="outline" onClick={() => router.push('/')}>Torna alla home</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Lista pazienti */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              I tuoi pazienti
            </CardTitle>
            <CardDescription>
              Seleziona un paziente per visualizzare le sessioni
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading.patients ? (
              <p className="text-center py-4">Caricamento pazienti...</p>
            ) : patients.length === 0 ? (
              <p className="text-center py-4 text-gray-500">Nessun paziente trovato</p>
            ) : (
              <div className="space-y-2">
                {patients.map((patient) => (
                  <div
                    key={patient.id}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedPatient?.id === patient.id 
                        ? 'bg-blue-100' 
                        : 'hover:bg-gray-100'
                    }`}
                    onClick={() => setSelectedPatient(patient)}
                  >
                    <div className="font-medium">
                      {patient.first_name 
                        ? `${patient.first_name} ${patient.last_name || ''}` 
                        : patient.email}
                    </div>
                    <div className="text-sm text-gray-500">
                      {patient.sessions?.length || 0} sessioni
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sessioni e analisi */}
        <div className="lg:col-span-3 space-y-6">
          {/* Sessioni del paziente */}
          {selectedPatient ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>
                    Sessioni di {selectedPatient.first_name || selectedPatient.email}
                  </CardTitle>
                  <CardDescription>
                    Seleziona una sessione per visualizzare i dettagli
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {!selectedPatient.sessions || selectedPatient.sessions.length === 0 ? (
                    <p className="text-center py-4 text-gray-500">
                      Nessuna sessione disponibile per questo paziente
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {selectedPatient.sessions.map((session) => (
                        <div
                          key={session.id}
                          className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                            selectedSession === session.id 
                              ? 'border-blue-500 bg-blue-50' 
                              : 'hover:bg-gray-50'
                          }`}
                          onClick={() => handleSelectSession(session.id)}
                        >
                          <h3 className="font-medium">
                            {session.title || `Sessione ${new Date(session.created_at).toLocaleDateString()}`}
                          </h3>
                          <p className="text-sm text-gray-500 mt-1">
                            Ultimo aggiornamento: {new Date(session.last_updated).toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Dettaglio sessione */}
              {selectedSession && (
                <Card>
                  <CardHeader>
                    <CardTitle>Analisi della Sessione</CardTitle>
                    <CardDescription>
                      Dati e analisi della sessione selezionata
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="summary">
                      <TabsList className="grid grid-cols-3 mb-6">
                        <TabsTrigger value="summary" className="flex items-center">
                          <BarChart4 className="h-4 w-4 mr-2" />
                          Riepilogo
                        </TabsTrigger>
                        <TabsTrigger value="mood" className="flex items-center">
                          <BrainCircuit className="h-4 w-4 mr-2" />
                          Analisi Umore
                        </TabsTrigger>
                        <TabsTrigger value="pathology" className="flex items-center">
                          <Microscope className="h-4 w-4 mr-2" />
                          Analisi Patologie
                        </TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="summary">
                        {isLoading.summary ? (
                          <p className="text-center py-4">Caricamento riepilogo...</p>
                        ) : (
                          <div 
                            dangerouslySetInnerHTML={{ __html: sessionSummary }} 
                            className="prose max-w-none"
                          />
                        )}
                      </TabsContent>
                      
                      <TabsContent value="mood">
                        {isLoading.mood ? (
                          <p className="text-center py-4">Caricamento analisi umore...</p>
                        ) : (
                          <div 
                            className="prose max-w-none"
                            dangerouslySetInnerHTML={{ 
                              __html: moodAnalysis.replace(/\n/g, '<br>') 
                            }} 
                          />
                        )}
                      </TabsContent>
                      
                      <TabsContent value="pathology">
                        {isLoading.pathology ? (
                          <p className="text-center py-4">Caricamento analisi patologie...</p>
                        ) : pathologyAnalysis ? (
                          <div className="space-y-6">
                            <div className="p-4 bg-yellow-50 rounded-lg">
                              <h3 className="font-medium text-lg mb-2">Nota Importante</h3>
                              <p className="text-sm">
                                Questa analisi è generata automaticamente e non sostituisce una valutazione professionale.
                                Utilizzala solo come supporto e non come diagnosi definitiva.
                              </p>
                            </div>
                            
                            <div>
                              <h3 className="font-medium text-lg mb-2">Riepilogo dell'Analisi</h3>
                              <p>{pathologyAnalysis.analysis_summary}</p>
                            </div>
                            
                            {pathologyAnalysis.possible_pathologies && 
                             pathologyAnalysis.possible_pathologies.length > 0 ? (
                              <div>
                                <h3 className="font-medium text-lg mb-2">Possibili Patologie</h3>
                                {pathologyAnalysis.possible_pathologies.map((item: any, index: number) => (
                                  <div key={index} className="mb-4 p-4 border rounded-lg">
                                    <div className="flex justify-between items-center">
                                      <h4 className="font-medium">{item.name}</h4>
                                      <span className="px-2 py-1 text-xs rounded-full bg-gray-200">
                                        Confidenza: {Math.round(item.confidence * 100)}%
                                      </span>
                                    </div>
                                    <p className="mt-1 text-sm">{item.description}</p>
                                    
                                    <h5 className="font-medium mt-3 mb-1 text-sm">Sintomi chiave:</h5>
                                    <ul className="list-disc pl-5 text-sm">
                                      {item.key_symptoms.map((symptom: string, i: number) => (
                                        <li key={i}>{symptom}</li>
                                      ))}
                                    </ul>
                                    
                                    {item.source && (
                                      <p className="text-xs text-gray-500 mt-2">
                                        Fonte: {item.source}
                                      </p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p>Non sono state identificate possibili patologie.</p>
                            )}
                          </div>
                        ) : (
                          <p className="text-center py-4 text-gray-500">
                            Seleziona una sessione per visualizzare l'analisi
                          </p>
                        )}
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center min-h-[300px]">
                <Users className="h-16 w-16 text-gray-300 mb-4" />
                <p className="text-gray-500">
                  Seleziona un paziente dalla lista per visualizzare le sessioni
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}