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
  // Metodo privato per verificare la sessione
  private async ensureSession(): Promise<string | null> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session || !session.access_token) {
      console.error("Nessuna sessione trovata, reindirizzamento alla pagina di login necessario");
      return null;
    }
    return session.access_token;
  }

  async sendMessage(
    message: string, 
    sessionId: string, 
    mood?: string
  ): Promise<ChatResponse> {
    try {
      console.log(`ApiClient: invio messaggio per sessione ${sessionId}`);
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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
        
        const errorData = await response.json();
        throw new Error(errorData.error || 'Si è verificato un errore');
      }

      return await response.json();
    } catch (error: any) {
      toast.error('Errore nell\'invio del messaggio', { 
        description: error.message || 'Si è verificato un errore imprevisto' 
      });
      throw error;
    }
  }

  async resetSession(sessionId: string): Promise<ResetSessionResponse> {
    try {
      const response = await fetch('/api/reset-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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
        
        const errorData = await response.json();
        throw new Error(errorData.error || 'Si è verificato un errore');
      }

      return await response.json();
    } catch (error: any) {
      toast.error('Errore nel reset della sessione', { description: error.message });
      throw error;
    }
  }

  async getSessionSummary(sessionId: string): Promise<{ summary_html: string }> {
    try {
      const response = await fetch(`/api/session-summary/${sessionId}`, {
        method: 'GET',
      });

      if (!response.ok) {
        if (response.status === 401) {
          toast.error('Sessione scaduta');
          setTimeout(() => window.location.href = '/login', 1500);
          throw new Error('Sessione scaduta');
        }
        
        const errorData = await response.json();
        throw new Error(errorData.error || 'Si è verificato un errore');
      }

      return await response.json();
    } catch (error: any) {
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
      
      const response = await fetch('/api/recommend-resources', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          session_id: sessionId,
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          toast.error('Sessione scaduta');
          setTimeout(() => window.location.href = '/login', 1500);
          throw new Error('Sessione scaduta');
        }
        
        const errorData = await response.json();
        throw new Error(errorData.error || 'Si è verificato un errore');
      }

      return await response.json();
    } catch (error: any) {
      toast.error('Errore nel recupero delle risorse', { description: error.message });
      throw error;
    }
  }

  async getMoodAnalysis(sessionId: string): Promise<MoodAnalysisResponse> {
    try {
      const response = await fetch('/api/mood-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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
        
        const errorData = await response.json();
        throw new Error(errorData.error || 'Si è verificato un errore');
      }

      return await response.json();
    } catch (error: any) {
      toast.error('Errore nell\'analisi dell\'umore', { description: error.message });
      throw error;
    }
  }

  async getPathologyAnalysis(sessionId: string): Promise<PathologyAnalysisResponse> {
    try {
      const response = await fetch('/api/pathology-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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
        
        const errorData = await response.json();
        throw new Error(errorData.error || 'Si è verificato un errore');
      }

      return await response.json();
    } catch (error: any) {
      toast.error('Errore nell\'analisi delle patologie', { description: error.message });
      throw error;
    }
  }
}

export const apiClient = new ApiClient();