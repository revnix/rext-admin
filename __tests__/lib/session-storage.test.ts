/**
 * Unit Tests for Session Storage Utility
 *
 * Tests all functionality of the session storage utility including
 * creation, retrieval, expiration, cleanup, and error handling.
 */

import {
  cleanupExpiredSessions,
  generateSessionId,
  getAllSessionMetadata,
  getAllSessions,
  getSession,
  getSessionMetadata,
  removeSession,
  saveSession,
  sessionStorageAPI,
  updateSession,
} from "@/lib/session-storage";
import type { SessionData } from "@/types/session";
import type {
  GeneratedTopic,
  TopicBuilderFormData,
} from "@/types/topic-builder";

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    key: jest.fn((index: number) => Object.keys(store)[index] || null),
    get length() {
      return Object.keys(store).length;
    },
  };
})();

// Mock crypto.randomUUID
const mockCrypto = {
  randomUUID: jest.fn(() => "mock-uuid-12345"),
};

// Setup
beforeAll(() => {
  Object.defineProperty(window, "localStorage", {
    value: localStorageMock,
    writable: true,
  });

  Object.defineProperty(global, "crypto", {
    value: mockCrypto,
    writable: true,
  });

  // Mock console methods to reduce test noise
  jest.spyOn(console, "log").mockImplementation();
  jest.spyOn(console, "warn").mockImplementation();
  jest.spyOn(console, "error").mockImplementation();
});

beforeEach(() => {
  localStorageMock.clear();
  jest.clearAllMocks();
});

afterAll(() => {
  jest.restoreAllMocks();
});

// ============================================================================
// TEST DATA
// ============================================================================

const mockFormData: TopicBuilderFormData = {
  wizardMode: "industry-first",
  industry: "technology",
  purpose: ["educate-inform"],
  num_topics: 10,
};

const mockTopic: GeneratedTopic = {
  id: "topic-1",
  title: "Test Topic",
  angle: "Test angle",
  description: "Test description",
  channel_fit: ["website"],
  audience_fit: ["developers"],
  why_it_works: "Test explanation",
  scores: {
    relevance: 0.8,
    seo_potential: 0.7,
    trend_level: 0.9,
    uniqueness: 0.8,
    reader_interest: 0.8,
    actionable_potential: 0.7,
    brand_alignment: 0.8,
    controversy: 0.2,
  },
  tags: ["technology", "testing"],
  created_at: "2024-01-01T00:00:00Z",
};

const mockTopic2: GeneratedTopic = {
  id: "topic-2",
  title: "Test Topic 2",
  angle: "Second test angle",
  description: "Second test description",
  channel_fit: ["blog"],
  audience_fit: ["designers"],
  why_it_works: "Second test explanation",
  scores: {
    relevance: 0.9,
    seo_potential: 0.6,
    trend_level: 0.8,
    uniqueness: 0.7,
    reader_interest: 0.9,
    actionable_potential: 0.6,
    brand_alignment: 0.8,
    controversy: 0.1,
  },
  tags: ["design", "testing"],
  created_at: "2024-01-01T00:00:00Z",
};

const mockTopic3: GeneratedTopic = {
  id: "topic-3",
  title: "Test Topic 3",
  angle: "Third test angle",
  description: "Third test description",
  channel_fit: ["social"],
  audience_fit: ["marketers"],
  why_it_works: "Third test explanation",
  scores: {
    relevance: 0.7,
    seo_potential: 0.8,
    trend_level: 0.7,
    uniqueness: 0.8,
    reader_interest: 0.7,
    actionable_potential: 0.8,
    brand_alignment: 0.7,
    controversy: 0.3,
  },
  tags: ["marketing", "testing"],
  created_at: "2024-01-01T00:00:00Z",
};

const mockTopics = [mockTopic, mockTopic2, mockTopic3];

const mockSessionData = {
  id: "test-session-123",
  topics: [mockTopic],
  formData: mockFormData,
};

// ============================================================================
// ID GENERATION TESTS
// ============================================================================

describe("generateSessionId", () => {
  it("should generate a unique ID using crypto.randomUUID when available", () => {
    const id = generateSessionId();
    expect(id).toBe("mock-uuid-12345");
    expect(mockCrypto.randomUUID).toHaveBeenCalled();
  });

  it("should fall back to timestamp-based ID when crypto is not available", () => {
    const originalCrypto = global.crypto;
    // biome-ignore lint/suspicious/noExplicitAny: Test setup requires deleting global properties
    delete (global as any).crypto;

    const id = generateSessionId();
    expect(typeof id).toBe("string");
    expect(id).toMatch(/^[a-z0-9]+-[a-z0-9]+$/);

    global.crypto = originalCrypto;
  });

  it("should generate different IDs on subsequent calls", () => {
    // Reset mock to return different values
    mockCrypto.randomUUID
      .mockReturnValueOnce("mock-uuid-first")
      .mockReturnValueOnce("mock-uuid-second");

    const id1 = generateSessionId();
    const id2 = generateSessionId();
    expect(id1).not.toBe(id2);
  });
});

// ============================================================================
// SESSION SAVE/RETRIEVE TESTS
// ============================================================================

describe("saveSession", () => {
  it("should save session with correct expiration timestamp", () => {
    const beforeSave = Date.now();
    saveSession(mockSessionData);
    const afterSave = Date.now();

    const key = `wrext-topic-session-${mockSessionData.id}`;
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      key,
      expect.any(String),
    );

    const stored = JSON.parse(
      localStorageMock.getItem(key) as string,
    ) as SessionData;
    expect(stored.id).toBe(mockSessionData.id);
    expect(stored.topics).toEqual(mockSessionData.topics);
    expect(stored.formData).toEqual(mockSessionData.formData);
    expect(stored.createdAt).toBeGreaterThanOrEqual(beforeSave);
    expect(stored.createdAt).toBeLessThanOrEqual(afterSave);
    expect(stored.expiresAt).toBe(stored.createdAt + 24 * 60 * 60 * 1000);
  });

  it("should handle localStorage errors gracefully", () => {
    localStorageMock.setItem.mockImplementationOnce(() => {
      throw new Error("Storage full");
    });

    expect(() => saveSession(mockSessionData)).toThrow(
      "Unable to save session",
    );
  });

  it("should not save when not in browser environment", () => {
    const originalWindow = global.window;
    const originalLocalStorage = global.localStorage;
    // biome-ignore lint/suspicious/noExplicitAny: Test setup requires deleting global properties
    delete (global as any).window;
    // biome-ignore lint/suspicious/noExplicitAny: Test setup requires deleting global properties
    delete (global as any).localStorage;

    // Clear previous calls
    localStorageMock.setItem.mockClear();

    saveSession(mockSessionData);
    expect(localStorageMock.setItem).not.toHaveBeenCalled();
    expect(console.warn).toHaveBeenCalledWith(
      "Session storage not available: not in browser environment",
    );

    global.window = originalWindow;
    global.localStorage = originalLocalStorage;
  });
});

describe("getSession", () => {
  it("should retrieve valid non-expired session", () => {
    // Save session first
    saveSession(mockSessionData);

    const retrieved = getSession(mockSessionData.id);
    expect(retrieved).not.toBeNull();
    expect(retrieved?.id).toBe(mockSessionData.id);
    expect(retrieved?.topics).toEqual(mockSessionData.topics);
    expect(retrieved?.formData).toEqual(mockSessionData.formData);
    expect(retrieved?.createdAt).toBeDefined();
    expect(retrieved?.expiresAt).toBeDefined();
  });

  it("should return null for non-existent session", () => {
    const retrieved = getSession("non-existent-id");
    expect(retrieved).toBeNull();
  });

  it("should automatically remove and return null for expired session", () => {
    // Create expired session data manually
    const expiredSession: SessionData = {
      ...mockSessionData,
      createdAt: Date.now() - 25 * 60 * 60 * 1000, // 25 hours ago
      expiresAt: Date.now() - 1 * 60 * 60 * 1000, // 1 hour ago
    };

    const key = `wrext-topic-session-${expiredSession.id}`;
    localStorageMock.setItem(key, JSON.stringify(expiredSession));

    const retrieved = getSession(expiredSession.id);
    expect(retrieved).toBeNull();
    expect(localStorageMock.removeItem).toHaveBeenCalledWith(key);
  });

  it("should handle corrupted session data and remove it", () => {
    const key = `wrext-topic-session-corrupted`;
    localStorageMock.setItem(key, "invalid-json");

    const retrieved = getSession("corrupted");
    expect(retrieved).toBeNull();
    expect(localStorageMock.removeItem).toHaveBeenCalledWith(key);
  });

  it("should not retrieve when not in browser environment", () => {
    const originalWindow = global.window;
    const originalLocalStorage = global.localStorage;
    // biome-ignore lint/suspicious/noExplicitAny: Test setup requires deleting global properties
    delete (global as any).window;
    // biome-ignore lint/suspicious/noExplicitAny: Test setup requires deleting global properties
    delete (global as any).localStorage;

    const retrieved = getSession("test-id");
    expect(retrieved).toBeNull();
    expect(console.warn).toHaveBeenCalledWith(
      "Session storage not available: not in browser environment",
    );

    global.window = originalWindow;
    global.localStorage = originalLocalStorage;
  });
});

// ============================================================================
// SESSION MANAGEMENT TESTS
// ============================================================================

describe("removeSession", () => {
  it("should remove session from storage", () => {
    saveSession(mockSessionData);
    removeSession(mockSessionData.id);

    const key = `wrext-topic-session-${mockSessionData.id}`;
    expect(localStorageMock.removeItem).toHaveBeenCalledWith(key);
  });

  it("should handle removal errors gracefully", () => {
    localStorageMock.removeItem.mockImplementationOnce(() => {
      throw new Error("Removal failed");
    });

    expect(() => removeSession("test-id")).not.toThrow();
    expect(console.error).toHaveBeenCalledWith(
      "Failed to remove session:",
      expect.any(Error),
    );
  });
});

describe("getAllSessions", () => {
  it("should return all non-expired sessions", () => {
    const session1 = { ...mockSessionData, id: "session-1" };
    const session2 = { ...mockSessionData, id: "session-2" };

    saveSession(session1);
    saveSession(session2);

    const allSessions = getAllSessions();
    expect(allSessions).toHaveLength(2);
    expect(allSessions.map((s) => s.id)).toContain("session-1");
    expect(allSessions.map((s) => s.id)).toContain("session-2");
  });

  it("should automatically clean up expired sessions", () => {
    const validSession = { ...mockSessionData, id: "valid-session" };
    const expiredSession: SessionData = {
      ...mockSessionData,
      id: "expired-session",
      createdAt: Date.now() - 25 * 60 * 60 * 1000,
      expiresAt: Date.now() - 1 * 60 * 60 * 1000,
    };

    saveSession(validSession);

    // Manually add expired session
    const expiredKey = `wrext-topic-session-${expiredSession.id}`;
    localStorageMock.setItem(expiredKey, JSON.stringify(expiredSession));

    const allSessions = getAllSessions();
    expect(allSessions).toHaveLength(1);
    expect(allSessions[0].id).toBe("valid-session");
    expect(localStorageMock.removeItem).toHaveBeenCalledWith(expiredKey);
  });

  it("should return sessions sorted by creation date (most recent first)", async () => {
    const olderSession = { ...mockSessionData, id: "older-session" };

    saveSession(olderSession);

    // Wait a bit to ensure different timestamps
    await new Promise((resolve) => setTimeout(resolve, 10));

    const newerSession = { ...mockSessionData, id: "newer-session" };
    saveSession(newerSession);

    const allSessions = getAllSessions();
    expect(allSessions).toHaveLength(2);
    if (allSessions.length >= 2) {
      expect(allSessions[0].createdAt).toBeGreaterThanOrEqual(
        allSessions[1].createdAt,
      );
    }
  });

  it("should return empty array when not in browser environment", () => {
    const originalWindow = global.window;
    // biome-ignore lint/suspicious/noExplicitAny: Test setup requires deleting global properties
    delete (global as any).window;

    const sessions = getAllSessions();
    expect(sessions).toEqual([]);

    global.window = originalWindow;
  });
});

describe("cleanupExpiredSessions", () => {
  it("should remove only expired sessions", () => {
    const validSession = { ...mockSessionData, id: "valid-session" };
    const expiredSession: SessionData = {
      ...mockSessionData,
      id: "expired-session",
      createdAt: Date.now() - 25 * 60 * 60 * 1000,
      expiresAt: Date.now() - 1 * 60 * 60 * 1000,
    };

    saveSession(validSession);

    // Manually add expired session
    const expiredKey = `wrext-topic-session-${expiredSession.id}`;
    localStorageMock.setItem(expiredKey, JSON.stringify(expiredSession));

    cleanupExpiredSessions();

    expect(localStorageMock.removeItem).toHaveBeenCalledWith(expiredKey);
    expect(getSession("valid-session")).not.toBeNull();
    expect(getSession("expired-session")).toBeNull();
  });

  it("should handle cleanup errors gracefully", () => {
    localStorageMock.removeItem.mockImplementationOnce(() => {
      throw new Error("Cleanup failed");
    });

    // Add an expired session
    const expiredSession: SessionData = {
      ...mockSessionData,
      id: "expired-session",
      createdAt: Date.now() - 25 * 60 * 60 * 1000,
      expiresAt: Date.now() - 1 * 60 * 60 * 1000,
    };
    const expiredKey = `wrext-topic-session-${expiredSession.id}`;
    localStorageMock.setItem(expiredKey, JSON.stringify(expiredSession));

    expect(() => cleanupExpiredSessions()).not.toThrow();
  });
});

// ============================================================================
// METADATA TESTS
// ============================================================================

describe("getSessionMetadata", () => {
  it("should return session metadata without full topic data", () => {
    saveSession(mockSessionData);

    const metadata = getSessionMetadata(mockSessionData.id);
    expect(metadata).not.toBeNull();
    expect(metadata?.id).toBe(mockSessionData.id);
    expect(metadata?.topicCount).toBe(1);
    expect(metadata?.industry).toBe("technology");
    expect(metadata?.contentType).toBe("unknown");
    expect(metadata?.createdAt).toBeDefined();
    expect(metadata?.expiresAt).toBeDefined();
  });

  it("should return null for expired session and clean it up", () => {
    const expiredSession: SessionData = {
      ...mockSessionData,
      createdAt: Date.now() - 25 * 60 * 60 * 1000,
      expiresAt: Date.now() - 1 * 60 * 60 * 1000,
    };

    const key = `wrext-topic-session-${expiredSession.id}`;
    localStorageMock.setItem(key, JSON.stringify(expiredSession));

    const metadata = getSessionMetadata(expiredSession.id);
    expect(metadata).toBeNull();
    expect(localStorageMock.removeItem).toHaveBeenCalledWith(key);
  });
});

describe("getAllSessionMetadata", () => {
  it("should return metadata for all valid sessions", () => {
    const session1 = { ...mockSessionData, id: "session-1" };
    const session2 = { ...mockSessionData, id: "session-2" };

    saveSession(session1);
    saveSession(session2);

    const allMetadata = getAllSessionMetadata();
    expect(allMetadata).toHaveLength(2);
    expect(allMetadata.every((m) => m.industry === "technology")).toBe(true);
    expect(allMetadata.every((m) => m.contentType === "unknown")).toBe(true);
  });
});

// ============================================================================
// UPDATE SESSION TESTS
// ============================================================================

describe("updateSession", () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  it("should append new topics to existing session", () => {
    const sessionId = generateSessionId();
    const originalTopics = [mockTopics[0]];
    const originalSession = {
      ...mockSessionData,
      id: sessionId,
      topics: originalTopics,
    };

    // Save original session
    saveSession(originalSession);

    // New topics to append
    const newTopics = [mockTopics[1], mockTopics[2]];

    // Update session with append=true (default)
    const updatedSession = updateSession(sessionId, newTopics, true);

    expect(updatedSession).not.toBeNull();
    expect(updatedSession?.topics).toHaveLength(3);
    expect(updatedSession?.topics).toEqual([...originalTopics, ...newTopics]);

    // Verify it was persisted
    const retrieved = getSession(sessionId);
    expect(retrieved?.topics).toHaveLength(3);
  });

  it("should replace topics when append=false", () => {
    const sessionId = generateSessionId();
    const originalTopics = [mockTopics[0], mockTopics[1]];
    const originalSession = {
      ...mockSessionData,
      id: sessionId,
      topics: originalTopics,
    };

    // Save original session
    saveSession(originalSession);

    // New topics to replace with
    const newTopics = [mockTopics[2]];

    // Update session with append=false
    const updatedSession = updateSession(sessionId, newTopics, false);

    expect(updatedSession).not.toBeNull();
    expect(updatedSession?.topics).toHaveLength(1);
    expect(updatedSession?.topics).toEqual(newTopics);

    // Verify it was persisted
    const retrieved = getSession(sessionId);
    expect(retrieved?.topics).toHaveLength(1);
  });

  it("should extend expiration time when updating", () => {
    const sessionId = generateSessionId();
    const originalSession = { ...mockSessionData, id: sessionId };

    // Save original session
    saveSession(originalSession);
    const original = getSession(sessionId);
    const originalExpiration = original?.expiresAt;

    // Wait a bit then update
    jest.advanceTimersByTime(1000);

    const updatedSession = updateSession(sessionId, [mockTopics[0]]);

    expect(updatedSession).not.toBeNull();
    expect(updatedSession?.expiresAt).toBeGreaterThan(originalExpiration || 0);
  });

  it("should return null for non-existent session", () => {
    const nonExistentId = generateSessionId();
    const result = updateSession(nonExistentId, [mockTopics[0]]);

    expect(result).toBeNull();
  });

  it("should handle empty topics array", () => {
    const sessionId = generateSessionId();
    const originalSession = {
      ...mockSessionData,
      id: sessionId,
      topics: mockTopics,
    };

    saveSession(originalSession);

    // Update with empty array and replace
    const updatedSession = updateSession(sessionId, [], false);

    expect(updatedSession).not.toBeNull();
    expect(updatedSession?.topics).toHaveLength(0);
  });

  it("should not update when not in browser environment", () => {
    const originalWindow = global.window;
    // @ts-expect-error
    delete global.window;

    const sessionId = generateSessionId();
    const result = updateSession(sessionId, [mockTopics[0]]);

    expect(result).toBeNull();

    global.window = originalWindow;
  });
});

// ============================================================================
// API OBJECT TESTS
// ============================================================================

describe("sessionStorageAPI", () => {
  it("should export all required functions", () => {
    expect(sessionStorageAPI.saveSession).toBe(saveSession);
    expect(sessionStorageAPI.getSession).toBe(getSession);
    expect(sessionStorageAPI.removeSession).toBe(removeSession);
    expect(sessionStorageAPI.getAllSessions).toBe(getAllSessions);
    expect(sessionStorageAPI.cleanupExpiredSessions).toBe(
      cleanupExpiredSessions,
    );
    expect(sessionStorageAPI.generateSessionId).toBe(generateSessionId);
  });

  it("should work as a complete API", () => {
    const sessionId = sessionStorageAPI.generateSessionId();
    const sessionData = { ...mockSessionData, id: sessionId };

    sessionStorageAPI.saveSession(sessionData);
    const retrieved = sessionStorageAPI.getSession(sessionId);
    expect(retrieved).not.toBeNull();
    expect(retrieved?.id).toBe(sessionId);

    const allSessions = sessionStorageAPI.getAllSessions();
    expect(allSessions).toHaveLength(1);

    sessionStorageAPI.removeSession(sessionId);
    const afterRemoval = sessionStorageAPI.getSession(sessionId);
    expect(afterRemoval).toBeNull();
  });
});
