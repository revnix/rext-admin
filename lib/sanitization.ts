import { safeJsonParse } from "./utils";

export const InputSanitizer = {
  sanitizeHtml(html: string): string {
    // Basic HTML sanitization without external dependencies
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "") // Remove script tags
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "") // Remove iframe tags
      .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, "") // Remove object tags
      .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, "") // Remove embed tags
      .replace(/on\w+\s*=\s*["'][^"']*["']/gi, "") // Remove event handlers
      .replace(/javascript:/gi, "") // Remove javascript: protocols
      .replace(/vbscript:/gi, "") // Remove vbscript: protocols
      .replace(/data:text\/html/gi, "") // Remove data:text/html
      .trim();
  },

  sanitizeText(text: string): string {
    return text
      .trim()
      .replace(/[<>]/g, "") // Remove angle brackets
      .replace(/javascript:/gi, "") // Remove javascript: protocols
      .replace(/on\w+=/gi, "") // Remove event handlers
      .slice(0, 10000); // Limit length
  },

  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 254;
  },

  validateUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      return ["http:", "https:"].includes(parsed.protocol);
    } catch {
      return false;
    }
  },

  sanitizeFilename(filename: string): string {
    return filename
      .replace(/[<>:"/\\|?*]/g, "") // Remove illegal filename characters
      .replace(/\.\./g, "") // Remove path traversal attempts
      .trim()
      .slice(0, 255); // Limit filename length
  },

  sanitizeJson(input: string): string {
    const parsed = safeJsonParse(input, {});
    return JSON.stringify(parsed ?? {});
  },

  containsXSS(input: string): boolean {
    const xssPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /data:text\/html/gi,
      /<iframe/gi,
      /<object/gi,
      /<embed/gi,
      /vbscript:/gi,
    ];

    return xssPatterns.some((pattern) => pattern.test(input));
  },

  sanitizeForLog(input: unknown): string {
    if (typeof input === "string") {
      return input
        .replace(/password\s*[:=]\s*[^\s,}]+/gi, "password: [REDACTED]")
        .replace(/token\s*[:=]\s*[^\s,}]+/gi, "token: [REDACTED]")
        .replace(/key\s*[:=]\s*[^\s,}]+/gi, "key: [REDACTED]")
        .slice(0, 1000); // Limit log entry length
    }

    if (typeof input === "object" && input !== null) {
      try {
        const sanitized = JSON.stringify(input, (key, value) => {
          if (
            typeof key === "string" &&
            /password|token|key|secret/i.test(key)
          ) {
            return "[REDACTED]";
          }
          return value;
        });
        return sanitized.slice(0, 1000);
      } catch {
        return "[Object - cannot stringify]";
      }
    }

    return String(input).slice(0, 1000);
  },
};
