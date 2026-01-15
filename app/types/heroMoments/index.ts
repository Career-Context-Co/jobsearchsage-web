/**
 * Hero Moments Type Definitions
 * 
 * This module defines all types used in the Hero Moments Discovery feature.
 * These types align with the backend DTOs and are used across components, stores, and services.
 */

/**
 * HeroMoment - A lightweight achievement moment captured during a discovery session
 * 
 * A moment is the entry point to developing a full HERO story. It captures
 * the essential information: title and raw conversational notes.
 */
export interface HeroMoment {
  /** Unique identifier (prefixed with 'moment_') */
  id: string | number
  
  /** Foreign key to the profile this moment belongs to */
  profile_id: string
  
  /** Title of the achievement (5-10 words) */
  title: string
  
  /** Raw conversational notes about the achievement (2-4 sentences) */
  raw_notes: string
  
  /** Optional FK to experience entry this moment relates to */
  source_experience_id?: string | number | null
  
  /** FK to the discovery session during which this moment was captured */
  discovery_session_id: string
  
  /** Timestamp when the moment was created */
  created_at: string
  
  /** Timestamp when the moment was last updated */
  updated_at: string
  
  /** Timestamp when the moment was converted to a full HERO story */
  converted_at?: string | null
  
  /** FK to the HERO story this moment was converted into */
  converted_story_id?: string | number | null
  
  /** Soft delete timestamp */
  deleted_at?: string | null
}

/**
 * DiscoverySession - Tracks a conversation session for moment discovery
 * 
 * A session represents one continuous discovery conversation where a user
 * talks to the AI coach about their achievements and captures moments.
 */
export interface DiscoverySession {
  /** Unique identifier (prefixed with 'session_') */
  id: string
  
  /** Foreign key to the profile this session belongs to */
  profile_id: string
  
  /** Current status of the session ('active', 'paused', 'completed', 'abandoned') */
  session_status: 'active' | 'paused' | 'completed' | 'abandoned'
  
  /** Timestamp when the session started */
  started_at: string
  
  /** Timestamp when the session ended */
  ended_at?: string | null
  
  /** Number of moments captured in this session */
  moment_count: number
  
  /** Session data including conversation history and captured moments */
  session_data?: {
    conversation_history?: Array<{
      role: 'user' | 'assistant'
      content: string
    }>
    captured_moments?: Array<{
      title: string
      rawNotes: string
    }>
    user_context?: {
      name?: string
      current_role?: string
      years_experience?: number
      source_experience_id?: string | number | null
      source_experience?: Record<string, any> | null
    }
  }
}

/**
 * MomentFormData - Form submission data for creating/updating a moment
 * 
 * Used when capturing a moment during discovery or editing an existing moment.
 */
export interface MomentFormData {
  /** Title of the achievement (5-10 words, max 50 chars) */
  title: string
  
  /** Raw conversational notes (2-4 sentences, max 500 chars) */
  raw_notes: string
  
  /** Optional FK to experience this moment relates to */
  source_experience_id?: string | number | null
}

/**
 * CapturedMoment - A moment as displayed in the UI
 * 
 * Simplified version of HeroMoment for display purposes.
 */
export interface CapturedMoment {
  id: string | number
  title: string
  raw_notes: string
  created_at: string
  status?: string
}

/**
 * DiscoveryUIState - State for managing UI during discovery session
 * 
 * Tracks the current state of the discovery session UI.
 */
export interface DiscoveryUIState {
  /** Is the discovery drawer open */
  isOpen: boolean
  
  /** Current discovery session ID */
  sessionId: string | null
  
  /** Is waiting for AI response */
  isLoading: boolean
  
  /** Error message if any */
  error: string | null
  
  /** Moments captured in current session */
  moments: CapturedMoment[]
}
