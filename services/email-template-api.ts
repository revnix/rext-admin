import { authenticatedFetch } from "@/lib/auth-utils";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:2024";

export interface EmailTemplate {
  id: string;
  workspace_id: string;
  template_type: string;
  subject: string;
  body: string;
  is_active: boolean;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateEmailTemplateRequest {
  workspace_id: string;
  template_type: string;
  subject: string;
  body: string;
}

export interface UpdateEmailTemplateRequest {
  subject?: string;
  body?: string;
  is_active?: boolean;
}

export interface PreviewEmailTemplateRequest {
  template_type: string;
  subject: string;
  body: string;
}

export interface PreviewEmailTemplateResponse {
  subject: string;
  body: string;
}

export interface TemplateVariables {
  [key: string]: string[];
}

export class EmailTemplateAPI {
  private async request<T>(
    endpoint: string,
    options?: RequestInit,
  ): Promise<T> {
    const response = await authenticatedFetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data;
  }

  /**
   * Get available variables for a template type
   */
  async getTemplateVariables(templateType: string): Promise<TemplateVariables> {
    return this.request<TemplateVariables>(
      `/api/v1/workspace/email-templates/variables/${templateType}`,
    );
  }

  /**
   * Preview a template with sample data
   */
  async previewTemplate(
    data: PreviewEmailTemplateRequest,
  ): Promise<PreviewEmailTemplateResponse> {
    return this.request<PreviewEmailTemplateResponse>(
      "/api/v1/workspace/email-templates/preview",
      {
        method: "POST",
        body: JSON.stringify(data),
      },
    );
  }

  /**
   * Get all templates for a workspace
   */
  async listTemplates(workspaceId: string): Promise<EmailTemplate[]> {
    return this.request<EmailTemplate[]>(
      `/api/v1/workspace/email-templates/${workspaceId}`,
    );
  }

  /**
   * Create a new email template
   */
  async createTemplate(
    data: CreateEmailTemplateRequest,
  ): Promise<EmailTemplate> {
    return this.request<EmailTemplate>("/api/v1/workspace/email-templates/", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  /**
   * Update an existing email template
   */
  async updateTemplate(
    templateId: string,
    data: UpdateEmailTemplateRequest,
  ): Promise<EmailTemplate> {
    return this.request<EmailTemplate>(
      `/api/v1/workspace/email-templates/${templateId}`,
      {
        method: "PUT",
        body: JSON.stringify(data),
      },
    );
  }

  /**
   * Delete an email template
   */
  async deleteTemplate(templateId: string): Promise<void> {
    await this.request<void>(
      `/api/v1/workspace/email-templates/${templateId}`,
      {
        method: "DELETE",
      },
    );
  }

  /**
   * Get default template for a type
   */
  async getDefaultTemplate(templateType: string): Promise<EmailTemplate> {
    return this.request<EmailTemplate>(
      `/api/v1/workspace/email-templates/defaults/${templateType}`,
    );
  }
}

export const emailTemplateAPI = new EmailTemplateAPI();
