/**
 * Brand Voice Service - Brand Voice Operations
 *
 * Handles brand voice analysis and management
 */

import type { WorkspaceApiConfig } from "@/types/workspace";

export class BrandVoiceService {
  private config: Partial<WorkspaceApiConfig>;

  constructor(config: Partial<WorkspaceApiConfig> = {}) {
    this.config = {
      baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:2024",
      timeout: 30000,
      enableRequestDeduplication: true,
      ...config,
    };
  }

  // Brand voice methods can be added here as backend implements them
  // Currently handled in workspace-service.ts
}

export const brandVoiceService = new BrandVoiceService();
