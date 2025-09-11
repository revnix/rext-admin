/**
 * Session Storage Types
 *
 * TypeScript interfaces for managing temporary session storage
 * with expiration logic for unsaved topic generation results.
 */

import type { GeneratedTopic, TopicBuilderFormData } from "./topic-builder";

/**
 * Data structure for a temporary session
 *
 * Contains all the information needed to restore a topic generation
 * session, including the generated topics and form data used.
 */
export interface SessionData {
  /** Unique identifier for this session */
  id: string;
  /** Generated topics from this session */
  topics: GeneratedTopic[];
  /** Form data used to generate these topics */
  formData: TopicBuilderFormData;
  /** Timestamp when session was created (milliseconds) */
  createdAt: number;
  /** Timestamp when session expires (milliseconds) */
  expiresAt: number;
}

/**
 * API interface for session storage utility functions
 *
 * Provides a consistent interface for managing temporary sessions
 * with automatic expiration and cleanup.
 */
export interface SessionStorageAPI {
  /** Save a new session with automatic expiration timestamp */
  saveSession: (data: Omit<SessionData, "createdAt" | "expiresAt">) => void;

  /** Get session by ID, returns null if not found or expired */
  getSession: (id: string) => SessionData | null;

  /** Remove a specific session from storage */
  removeSession: (id: string) => void;

  /** Get all non-expired sessions */
  getAllSessions: () => SessionData[];

  /** Remove all expired sessions from storage */
  cleanupExpiredSessions: () => void;

  /** Generate a unique session ID */
  generateSessionId: () => string;
}

/**
 * Session metadata for UI display
 *
 * Lightweight version of SessionData for displaying
 * session information without loading full topic data.
 */
export interface SessionMetadata {
  /** Session ID */
  id: string;
  /** Number of topics in this session */
  topicCount: number;
  /** When session was created */
  createdAt: number;
  /** When session expires */
  expiresAt: number;
  /** Industry from form data for display */
  industry: string;
  /** Content type from form data for display */
  contentType: string;
}
