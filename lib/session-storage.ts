/**
 * Session Storage Utility
 *
 * Manages temporary session storage for unsaved topic generation results
 * with automatic expiration and cleanup functionality.
 *
 * Features:
 * - 24-hour session expiration
 * - Automatic cleanup of expired sessions
 * - Unique ID generation
 * - Error handling for localStorage failures
 * - Type-safe operations
 */

import type {
  SessionData,
  SessionMetadata,
  SessionStorageAPI,
} from "@/types/session";

// ============================================================================
// CONSTANTS
// ============================================================================

/** Prefix for session storage keys in localStorage */
const SESSION_KEY_PREFIX = "wrext-topic-session-";

/** Session expiration time: 24 hours in milliseconds */
const SESSION_EXPIRY = 24 * 60 * 60 * 1000;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Generate a unique session ID
 *
 * Uses crypto.randomUUID() when available, falls back to timestamp-based ID
 */
export const generateSessionId = (): string => {
  try {
    // Use crypto.randomUUID() if available (modern browsers)
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
      return crypto.randomUUID();
    }
  } catch (_error) {
    console.warn("crypto.randomUUID() not available, using fallback");
  }

  // Fallback: timestamp + random number
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 15);
  return `${timestamp}-${random}`;
};

/**
 * Get the localStorage key for a session ID
 */
const getSessionKey = (id: string): string => {
  return `${SESSION_KEY_PREFIX}${id}`;
};

/**
 * Check if we're in a browser environment
 */
const isBrowser = (): boolean => {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
};

// ============================================================================
// CORE SESSION STORAGE FUNCTIONS
// ============================================================================

/**
 * Save a session to localStorage with automatic expiration timestamp
 */
export const saveSession = (
  data: Omit<SessionData, "createdAt" | "expiresAt">,
): void => {
  if (!isBrowser()) {
    console.warn("Session storage not available: not in browser environment");
    return;
  }

  try {
    const now = Date.now();
    const sessionData: SessionData = {
      ...data,
      createdAt: now,
      expiresAt: now + SESSION_EXPIRY,
    };

    const key = getSessionKey(data.id);
    localStorage.setItem(key, JSON.stringify(sessionData));

    console.log(`Session saved: ${data.id}`, {
      topicsCount: data.topics.length,
      expiresAt: new Date(sessionData.expiresAt).toISOString(),
    });
  } catch (error) {
    console.error("Failed to save session:", error);
    throw new Error(
      "Unable to save session. Storage may be full or unavailable.",
    );
  }
};

/**
 * Get a session by ID, automatically removing if expired
 *
 * @param id Session ID to retrieve
 * @returns Session data or null if not found/expired
 */
export const getSession = (id: string): SessionData | null => {
  if (!isBrowser()) {
    console.warn("Session storage not available: not in browser environment");
    return null;
  }

  try {
    const key = getSessionKey(id);
    const stored = localStorage.getItem(key);

    if (!stored) {
      return null;
    }

    const sessionData = JSON.parse(stored) as SessionData;

    // Check if session has expired
    if (Date.now() > sessionData.expiresAt) {
      console.log(`Session expired, removing: ${id}`);
      localStorage.removeItem(key);
      return null;
    }

    console.log(`Session retrieved: ${id}`, {
      topicsCount: sessionData.topics.length,
      timeRemaining:
        Math.round((sessionData.expiresAt - Date.now()) / (1000 * 60 * 60)) +
        "h",
    });

    return sessionData;
  } catch (error) {
    console.error("Failed to retrieve session:", error);
    // Remove corrupted session data
    try {
      const key = getSessionKey(id);
      localStorage.removeItem(key);
    } catch (cleanupError) {
      console.error("Failed to cleanup corrupted session:", cleanupError);
    }
    return null;
  }
};

/**
 * Remove a specific session from storage
 */
export const removeSession = (id: string): void => {
  if (!isBrowser()) {
    console.warn("Session storage not available: not in browser environment");
    return;
  }

  try {
    const key = getSessionKey(id);
    localStorage.removeItem(key);
    console.log(`Session removed: ${id}`);
  } catch (error) {
    console.error("Failed to remove session:", error);
  }
};

/**
 * Get all non-expired sessions
 *
 * Automatically cleans up expired sessions during retrieval
 */
export const getAllSessions = (): SessionData[] => {
  if (!isBrowser()) {
    console.warn("Session storage not available: not in browser environment");
    return [];
  }

  const sessions: SessionData[] = [];
  const keysToRemove: string[] = [];

  try {
    // Iterate through all localStorage keys
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);

      if (!key || !key.startsWith(SESSION_KEY_PREFIX)) {
        continue;
      }

      try {
        const stored = localStorage.getItem(key);
        if (!stored) continue;

        const sessionData = JSON.parse(stored) as SessionData;

        // Check if session has expired
        if (Date.now() > sessionData.expiresAt) {
          keysToRemove.push(key);
          continue;
        }

        sessions.push(sessionData);
      } catch (_parseError) {
        console.error(
          "Failed to parse session data, marking for removal:",
          key,
        );
        keysToRemove.push(key);
      }
    }

    // Clean up expired/corrupted sessions
    keysToRemove.forEach((key) => {
      try {
        localStorage.removeItem(key);
      } catch (removeError) {
        console.error("Failed to remove expired session:", removeError);
      }
    });

    console.log(
      `Retrieved ${sessions.length} active sessions, cleaned up ${keysToRemove.length} expired sessions`,
    );

    return sessions.sort((a, b) => b.createdAt - a.createdAt); // Most recent first
  } catch (error) {
    console.error("Failed to retrieve sessions:", error);
    return [];
  }
};

/**
 * Remove all expired sessions from storage
 *
 * Useful for periodic cleanup
 */
export const cleanupExpiredSessions = (): void => {
  if (!isBrowser()) {
    console.warn("Session storage not available: not in browser environment");
    return;
  }

  let cleanedCount = 0;

  try {
    // Iterate through all localStorage keys
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);

      if (!key || !key.startsWith(SESSION_KEY_PREFIX)) {
        continue;
      }

      try {
        const stored = localStorage.getItem(key);
        if (!stored) continue;

        const sessionData = JSON.parse(stored) as SessionData;

        // Remove if expired
        if (Date.now() > sessionData.expiresAt) {
          localStorage.removeItem(key);
          cleanedCount++;
        }
      } catch (_parseError) {
        // Remove corrupted data
        localStorage.removeItem(key);
        cleanedCount++;
        console.warn("Removed corrupted session data:", key);
      }
    }

    if (cleanedCount > 0) {
      console.log(`Cleaned up ${cleanedCount} expired sessions`);
    }
  } catch (error) {
    console.error("Failed to cleanup expired sessions:", error);
  }
};

// ============================================================================
// UTILITY FUNCTIONS FOR UI
// ============================================================================

/**
 * Get session metadata without loading full topic data
 *
 * Useful for displaying session lists without heavy data loading
 */
export const getSessionMetadata = (id: string): SessionMetadata | null => {
  if (!isBrowser()) {
    return null;
  }

  try {
    const key = getSessionKey(id);
    const stored = localStorage.getItem(key);

    if (!stored) {
      return null;
    }

    const sessionData = JSON.parse(stored) as SessionData;

    // Check if session has expired
    if (Date.now() > sessionData.expiresAt) {
      localStorage.removeItem(key);
      return null;
    }

    return {
      id: sessionData.id,
      topicCount: sessionData.topics.length,
      createdAt: sessionData.createdAt,
      expiresAt: sessionData.expiresAt,
      industry: sessionData.formData.industry,
      contentType: sessionData.formData.content_type,
    };
  } catch (error) {
    console.error("Failed to retrieve session metadata:", error);
    return null;
  }
};

/**
 * Get all session metadata for UI display
 */
export const getAllSessionMetadata = (): SessionMetadata[] => {
  if (!isBrowser()) {
    return [];
  }

  const metadata: SessionMetadata[] = [];
  const keysToRemove: string[] = [];

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);

      if (!key || !key.startsWith(SESSION_KEY_PREFIX)) {
        continue;
      }

      try {
        const stored = localStorage.getItem(key);
        if (!stored) continue;

        const sessionData = JSON.parse(stored) as SessionData;

        // Check if session has expired
        if (Date.now() > sessionData.expiresAt) {
          keysToRemove.push(key);
          continue;
        }

        metadata.push({
          id: sessionData.id,
          topicCount: sessionData.topics.length,
          createdAt: sessionData.createdAt,
          expiresAt: sessionData.expiresAt,
          industry: sessionData.formData.industry,
          contentType: sessionData.formData.content_type,
        });
      } catch (_parseError) {
        keysToRemove.push(key);
      }
    }

    // Clean up expired/corrupted sessions
    keysToRemove.forEach((key) => {
      try {
        localStorage.removeItem(key);
      } catch (removeError) {
        console.error("Failed to remove expired session:", removeError);
      }
    });

    return metadata.sort((a, b) => b.createdAt - a.createdAt);
  } catch (error) {
    console.error("Failed to retrieve session metadata:", error);
    return [];
  }
};

// ============================================================================
// API OBJECT EXPORT
// ============================================================================

/**
 * Complete session storage API
 *
 * Provides all functionality needed for managing temporary sessions
 */
export const sessionStorageAPI: SessionStorageAPI = {
  saveSession,
  getSession,
  removeSession,
  getAllSessions,
  cleanupExpiredSessions,
  generateSessionId,
};

// Default export for convenience
export default sessionStorageAPI;
