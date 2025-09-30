import type { NextRequest } from "next/server";

interface RateLimitConfig {
  interval: number; // Time window in milliseconds
  uniqueTokenPerInterval: number; // Max requests per interval
}

class RateLimiter {
  private cache = new Map<string, { count: number; resetTime: number }>();

  constructor(private config: RateLimitConfig) {}

  async limit(
    identifier: string,
  ): Promise<{ success: boolean; remaining: number }> {
    const now = Date.now();
    const _windowStart = now - this.config.interval;

    // Clean expired entries
    for (const [key, value] of this.cache.entries()) {
      if (value.resetTime < now) {
        this.cache.delete(key);
      }
    }

    const current = this.cache.get(identifier);

    if (!current || current.resetTime < now) {
      // First request in window or window expired
      this.cache.set(identifier, {
        count: 1,
        resetTime: now + this.config.interval,
      });
      return {
        success: true,
        remaining: this.config.uniqueTokenPerInterval - 1,
      };
    }

    if (current.count >= this.config.uniqueTokenPerInterval) {
      // Rate limit exceeded
      return { success: false, remaining: 0 };
    }

    // Increment count
    current.count += 1;
    return {
      success: true,
      remaining: this.config.uniqueTokenPerInterval - current.count,
    };
  }
}

// Rate limiter instances
export const apiRateLimiter = new RateLimiter({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 60, // 60 requests per minute
});

export const strictRateLimiter = new RateLimiter({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 10, // 10 requests per minute
});

export function getRateLimitIdentifier(request: NextRequest): string {
  // Use IP address as identifier
  const forwarded = request.headers.get("x-forwarded-for");
  const ip =
    forwarded?.split(",")[0] ?? request.headers.get("x-real-ip") ?? "anonymous";
  return ip;
}
