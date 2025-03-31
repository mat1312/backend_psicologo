import { toast } from 'sonner';

export type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

// src/lib/apiClient.ts
// Modifica l'interfaccia ChatResponse

export interface ChatResponse {
    answer: string;
    sources?: Array<{
      file_name?: string;
      page?: number;
      text?: string;
    }>;
    analysis?: string;
    audio_url?: string; // Aggiunta questa proprietà, Modifica backend
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
  async sendMessage(
    message: string, 
    sessionId: string, 
    mood?: string
  ): Promise<ChatResponse> {
    try {
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