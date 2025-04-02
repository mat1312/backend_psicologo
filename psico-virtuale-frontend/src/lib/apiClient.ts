// src/lib/apiClient.ts
import { toast } from 'sonner';
import { supabase } from './supabase';

export type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export interface ChatResponse {
  answer: string;
  sources?: Array<{
    file_name?: string;
    page?: number;
    text?: string;
  }>;
  analysis?: string;
  audio_url?: string;
}

export interface ResetSessionResponse {
  status: string;
  message: string;
}

export interface ResourceItem {
  title: string;
  description: string;
  type: string;
}

export interface ResourcesResponse {
  resources: ResourceItem[];
}

export interface MoodAnalysisResponse {
  mood_analysis: string;
}

export interface PathologyItem {
  name: string;
  description: string;
  confidence: number;
  key_symptoms: string[];
  source?: string;
}

export interface PathologyAnalysisResponse {
  possible_pathologies: PathologyItem[];
  analysis_summary: string;
}

class ApiClient {
  // Metodo privato migliorato per verificare la sessione
  private async ensureSession(): Promise<string | null> {
    try {
      // Ottieni la sessione corrente
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error("Errore nel recuperare la sessione:", sessionError);
        return null;
      }
      
      if (!session || !session.access_token) {
        console.error("Nessuna sessione trovata o token mancante");
        return null;
      }
      
      // Controllo scadenza token
      if (session.expires_at) {
        const now = Date.now() / 1000;
        const expiresAt = session.expires_at;
        const timeLeft = expiresAt - now;
        
        console.log(`Token presente, scade tra: ${Math.floor(timeLeft / 60)} minuti e ${Math.floor(timeLeft % 60)} secondi`);
        
        // Se il token scade in meno di 5 minuti, tenta di aggiornarlo
        if (timeLeft < 300) {
          console.log("Token in scadenza, tentativo di aggiornamento...");
          
          try {
            const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
            
            if (refreshError) {
              console.error("Errore nell'aggiornamento del token:", refreshError);
              // Continua con il token esistente
            } else if (refreshData && refreshData.session) {
              console.log("Token aggiornato con successo");
              return refreshData.session.access_token;
            }
          } catch (refreshError) {
            console.error("Errore imprevisto nell'aggiornamento del token:", refreshError);
            // Continua con il token esistente
          }
        }
      } else {
        console.log("Token presente, ma scadenza non disponibile");
      }
      
      return session.access_token;
    } catch (error) {
      console.error("Errore nel verificare la sessione:", error);
      return null;
    }
  }

  async sendMessage(
    message: string, 
    sessionId: string, 
    mood?: string
  ): Promise<ChatResponse> {
    try {
      console.log(`ApiClient: invio messaggio per sessione ${sessionId}`);
      
      // Ottieni il token di autenticazione
      const token = await this.ensureSession();
      
      if (!token) {
        console.error("Nessun token disponibile per la richiesta");
        toast.error('Sessione non valida', { 
          description: 'Effettua nuovamente il login'
        });
        
        setTimeout(() => {
          window.location.href = '/login';
        }, 1500);
        
        throw new Error('Sessione non valida, effettua nuovamente il login');
      }
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // Invia il token nel header
        },
        body: JSON.stringify({
          query: message,
          session_id: sessionId,
          mood,
        }),
      });

      if (!response.ok) {
        // Errore di autenticazione
        if (response.status === 401) {
          toast.error('Sessione scaduta', { 
            description: 'Effettua nuovamente il login'
          });
          
          // Reindirizza alla pagina di login dopo un breve ritardo
          setTimeout(() => {
            window.location.href = '/login';
          }, 1500);
          
          throw new Error('Sessione scaduta, effettua nuovamente il login');
        }
        
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          const errorText = await response.text();
          throw new Error(errorText || 'Si è verificato un errore');
        }
        
        throw new Error(errorData.error || 'Si è verificato un errore');
      }

      return await response.json();
    } catch (error: any) {
      console.error("Errore dettagliato:", error);
      toast.error('Errore nell\'invio del messaggio', { 
        description: error.message || 'Si è verificato un errore imprevisto' 
      });
      throw error;
    }
  }

  async resetSession(sessionId: string): Promise<ResetSessionResponse> {
    try {
      // Ottieni il token di autenticazione
      const token = await this.ensureSession();
      
      if (!token) {
        console.error("Nessun token disponibile per la richiesta");
        toast.error('Sessione non valida', { 
          description: 'Effettua nuovamente il login'
        });
        
        setTimeout(() => {
          window.location.href = '/login';
        }, 1500);
        
        throw new Error('Sessione non valida, effettua nuovamente il login');
      }
      
      const response = await fetch('/api/reset-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // Invia il token nel header
        },
        body: JSON.stringify({
          session_id: sessionId,
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          toast.error('Sessione scaduta', { 
            description: 'Effettua nuovamente il login'
          });
          
          setTimeout(() => {
            window.location.href = '/login';
          }, 1500);
          
          throw new Error('Sessione scaduta');
        }
        
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          const errorText = await response.text();
          throw new Error(errorText || 'Si è verificato un errore');
        }
        
        throw new Error(errorData.error || 'Si è verificato un errore');
      }

      return await response.json();
    } catch (error: any) {
      console.error("Errore dettagliato:", error);
      toast.error('Errore nel reset della sessione', { description: error.message });
      throw error;
    }
  }

  async getSessionSummary(sessionId: string): Promise<{ summary_html: string }> {
    try {
      // Ottieni il token di autenticazione
      const token = await this.ensureSession();
      
      if (!token) {
        console.error("Nessun token disponibile per la richiesta");
        toast.error('Sessione non valida', { 
          description: 'Effettua nuovamente il login'
        });
        
        setTimeout(() => {
          window.location.href = '/login';
        }, 1500);
        
        throw new Error('Sessione non valida, effettua nuovamente il login');
      }
      
      const response = await fetch(`/api/session-summary/${sessionId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}` // Invia il token nel header
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          toast.error('Sessione scaduta');
          setTimeout(() => window.location.href = '/login', 1500);
          throw new Error('Sessione scaduta');
        }
        
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          const errorText = await response.text();
          throw new Error(errorText || 'Si è verificato un errore');
        }
        
        throw new Error(errorData.error || 'Si è verificato un errore');
      }

      return await response.json();
    } catch (error: any) {
      console.error("Errore dettagliato:", error);
      toast.error('Errore nel recupero del riepilogo', { description: error.message });
      throw error;
    }
  }

  async getResourceRecommendations(
    query: string, 
    sessionId: string
  ): Promise<ResourcesResponse> {
    try {
      console.log(`ApiClient: richiesta risorse per sessione ${sessionId}`);
      
      // Verifica la sessione e ottieni il token
      const token = await this.ensureSession();
      
      if (!token) {
        console.error("Nessun token disponibile per la richiesta");
        toast.error('Sessione non valida', { 
          description: 'Effettua nuovamente il login'
        });
        
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
        
        throw new Error('Sessione non valida, effettua nuovamente il login');
      }
      
      const response = await fetch('/api/recommend-resources', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          query,
          session_id: sessionId,
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          console.error("Errore 401 ricevuto - sessione scaduta");
          toast.error('Sessione scaduta', { 
            description: 'Effettua nuovamente il login'
          });
          
          // Non reindirizzare immediatamente, attendi un po'
          setTimeout(() => {
            window.location.href = '/login';
          }, 2000);
          
          throw new Error('Sessione scaduta, effettua nuovamente il login');
        }
        
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          const errorText = await response.text();
          throw new Error(errorText || 'Si è verificato un errore');
        }
        
        throw new Error(errorData.error || 'Si è verificato un errore');
      }

      return await response.json();
    } catch (error: any) {
      console.error("Errore dettagliato:", error);
      toast.error('Errore nel recupero delle risorse', { 
        description: error.message || 'Si è verificato un errore imprevisto' 
      });
      throw error;
    }
  }

  async getMoodAnalysis(sessionId: string): Promise<MoodAnalysisResponse> {
    try {
      // Ottieni il token di autenticazione
      const token = await this.ensureSession();
      
      if (!token) {
        console.error("Nessun token disponibile per la richiesta");
        toast.error('Sessione non valida', { 
          description: 'Effettua nuovamente il login'
        });
        
        setTimeout(() => {
          window.location.href = '/login';
        }, 1500);
        
        throw new Error('Sessione non valida, effettua nuovamente il login');
      }
      
      const response = await fetch('/api/mood-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // Invia il token nel header
        },
        body: JSON.stringify({
          session_id: sessionId,
          analyze_chatbot: true,
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          toast.error('Sessione scaduta');
          setTimeout(() => window.location.href = '/login', 1500);
          throw new Error('Sessione scaduta');
        }
        
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          const errorText = await response.text();
          throw new Error(errorText || 'Si è verificato un errore');
        }
        
        throw new Error(errorData.error || 'Si è verificato un errore');
      }

      return await response.json();
    } catch (error: any) {
      console.error("Errore dettagliato:", error);
      toast.error('Errore nell\'analisi dell\'umore', { description: error.message });
      throw error;
    }
  }

  async getPathologyAnalysis(sessionId: string): Promise<PathologyAnalysisResponse> {
    try {
      // Ottieni il token di autenticazione
      const token = await this.ensureSession();
      
      if (!token) {
        console.error("Nessun token disponibile per la richiesta");
        toast.error('Sessione non valida', { 
          description: 'Effettua nuovamente il login'
        });
        
        setTimeout(() => {
          window.location.href = '/login';
        }, 1500);
        
        throw new Error('Sessione non valida, effettua nuovamente il login');
      }
      
      const response = await fetch('/api/pathology-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // Invia il token nel header
        },
        body: JSON.stringify({
          session_id: sessionId,
          analyze_chatbot: true,
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          toast.error('Sessione scaduta');
          setTimeout(() => window.location.href = '/login', 1500);
          throw new Error('Sessione scaduta');
        }
        
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          const errorText = await response.text();
          throw new Error(errorText || 'Si è verificato un errore');
        }
        
        throw new Error(errorData.error || 'Si è verificato un errore');
      }

      return await response.json();
    } catch (error: any) {
      console.error("Errore dettagliato:", error);
      toast.error('Errore nell\'analisi delle patologie', { description: error.message });
      throw error;
    }
  }
}

export const apiClient = new ApiClient();