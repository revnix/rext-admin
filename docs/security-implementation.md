# Security Implementation Guide

## Overview

This document outlines the comprehensive security measures implemented in wrext-admin following a critical security audit in September 2024. The implementation spans API security, authentication, rate limiting, input validation, and security headers.

## 🛡️ API Security

### Server-Side API Proxy Pattern

All external API calls are now proxied through Next.js API routes to prevent client-side key exposure and provide centralized security controls.

**Implementation Details:**
- External API keys stored server-side only in `.env.local`
- All client requests go through `/app/api/` routes
- Input validation with Zod schemas before external API calls
- Rate limiting per IP address with configurable limits
- Proper error handling without information leakage
- Request/response logging for security monitoring

**Architecture:**
```
Client Request → Next.js API Route → Input Validation → Rate Limiting → External API
     ↑                                                                        ↓
   Response ← Error Handling ← Response Processing ← Security Headers ← API Response
```

### Environment Variables Security

**Server-side only (in `.env.local`):**
```bash
# Required: Content API authentication
NEXT_PUBLIC_CONTENT_API_KEY=your_secure_api_key

# Required: Backend API URL
BACKEND_API_URL=http://127.0.0.1:2024

# Required: AI Provider API Keys
ANTHROPIC_API_KEY=your_anthropic_api_key
PERPLEXITY_API_KEY=your_perplexity_api_key

# Optional: Additional AI providers
OPENAI_API_KEY=your_openai_api_key
GOOGLE_API_KEY=your_google_api_key
```

**Critical Security Rules:**
- ❌ **NEVER** use `NEXT_PUBLIC_` prefix for sensitive data
- ❌ **NEVER** commit `.env.local` to version control
- ✅ **ALWAYS** use `.env.local` for server-side secrets
- ✅ **ALWAYS** validate environment variables on startup

## 🚦 Rate Limiting

### Implementation Architecture

Rate limiting is implemented using an in-memory cache system with IP-based identification.

**Configuration:**
- **API Routes**: 60 requests/minute per IP (`apiRateLimiter`)
- **Strict Endpoints**: 10 requests/minute per IP (`strictRateLimiter`)
- **Automatic cleanup** of expired rate limit entries
- **IP identification** with fallback for anonymous requests

**Rate Limiter Features:**
```typescript
// File: lib/rate-limit.ts
interface RateLimitConfig {
  interval: number; // Time window in milliseconds
  uniqueTokenPerInterval: number; // Max requests per interval
}
```

**Integration Example:**
```typescript
// API Route Implementation
const identifier = getRateLimitIdentifier(request);
const { success, remaining } = await apiRateLimiter.limit(identifier);

if (!success) {
  return createErrorResponse(
    'Rate limit exceeded',
    'api_rate_limit_exceeded',
    context.requestId,
    429,
    'Too many requests. Please try again later.',
    60
  );
}
```

**Headers Returned:**
- `X-RateLimit-Remaining`: Number of requests remaining
- `X-RateLimit-Reset`: Timestamp when limit resets

## 🔒 Input Validation & Sanitization

### Zod Schema Validation

Comprehensive input validation using Zod v4.1.5 with performance optimizations.

**Content Validation Schema:**
```typescript
// File: schemas/content-schemas.ts
export const GenerateContentRequestSchema = z.object({
  prompt: z
    .string()
    .min(1, 'Prompt is required')
    .max(2000, 'Prompt must be less than 2000 characters')
    .refine(
      (val) => {
        const sanitized = val.trim();
        return sanitized.length > 0 && !containsUnsafeContent(sanitized);
      },
      { message: 'Prompt contains invalid content' }
    ),

  model: z.enum(['claude-3-5-sonnet', 'gpt-4o', 'gpt-4o-mini'], {
    message: 'Invalid model selection'
  }),

  options: z.object({
    temperature: z.number().min(0).max(2).optional(),
    maxTokens: z.number().min(1).max(4000).optional(),
    topP: z.number().min(0).max(1).optional(),
  }).optional()
});
```

### Input Sanitization

**Sanitization Functions** (`lib/sanitization.ts`):

1. **HTML Sanitization**:
   - Removes `<script>`, `<iframe>`, `<object>`, `<embed>` tags
   - Strips event handlers (`onclick`, `onload`, etc.)
   - Removes `javascript:` and `vbscript:` protocols
   - Blocks `data:text/html` content

2. **Text Sanitization**:
   - Removes angle brackets (`<>`)
   - Strips JavaScript protocols
   - Removes event handlers
   - Limits input length (10,000 characters)

3. **XSS Detection**:
   - Pattern-based XSS detection
   - Security logging without sensitive data exposure
   - Automatic rejection of malicious content

4. **Log Sanitization**:
   - Automatic redaction of passwords, tokens, keys
   - Length limits on log entries (1,000 characters)
   - Safe JSON stringification

**Backend Integration:**
```typescript
// File: services/backend.ts
private validateAndSanitizeFormData(formData: TopicBuilderFormData): TopicBuilderFormData {
  if (!this.validationConfig.skipInputValidation) {
    const sanitized = {
      ...formData,
      industry: formData.industry
        ? InputSanitizer.sanitizeText(formData.industry)
        : formData.industry,
      // ... other fields
    };

    // XSS detection with logging
    for (const field of textFields) {
      if (typeof field === 'string' && InputSanitizer.containsXSS(field)) {
        this.log.warn('XSS attempt detected in form data');
        throw new Error('Invalid input detected. Please check your form data.');
      }
    }
  }
}
```

## 🔐 Security Headers

### Middleware Implementation

Security headers are implemented via Next.js middleware (`middleware.ts`):

**Headers Applied:**
```typescript
// DNS prefetch control
response.headers.set('X-DNS-Prefetch-Control', 'on');

// XSS Protection
response.headers.set('X-XSS-Protection', '1; mode=block');

// Frame options (prevent clickjacking)
response.headers.set('X-Frame-Options', 'DENY');

// Content type sniffing protection
response.headers.set('X-Content-Type-Options', 'nosniff');

// Referrer policy
response.headers.set('Referrer-Policy', 'origin-when-cross-origin');
```

**Content Security Policy (CSP):**
```javascript
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' blob: data:",
  "font-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests"
].join('; ');
```

**HTTP Strict Transport Security (HSTS):**
- **Production only**: `max-age=31536000; includeSubDomains; preload`
- **Development**: Disabled to allow HTTP localhost

**Middleware Configuration:**
```typescript
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
```

## 📊 Monitoring & Logging

### Error Logging

**Sanitized Logging:**
- Automatic redaction of sensitive data (passwords, tokens, keys)
- Structured logging with request correlation IDs
- Security event tracking without information leakage

**Log Categories:**
- **Security Events**: XSS attempts, rate limit violations
- **API Errors**: Failed requests, validation errors
- **Performance**: Rate limit status, response times
- **Debug**: Request flows (development only)

**Example Log Entry:**
```json
{
  "level": "warn",
  "message": "XSS attempt detected in form data",
  "requestId": "req_abc123",
  "timestamp": "2024-09-21T10:30:00Z",
  "field_content": "[REDACTED]",
  "component": "BackendService"
}
```

### Rate Limit Monitoring

**Metrics Tracked:**
- Requests per minute per IP
- Rate limit violations
- Cache hit/miss ratios
- Automatic cleanup cycles

**Headers for Monitoring:**
- `X-RateLimit-Remaining`: Client can monitor usage
- `X-RateLimit-Reset`: Provides reset timestamp

## 🚀 Deployment Security

### Production Checklist

**Environment Variables:**
- [ ] All sensitive keys in production environment variables
- [ ] No `.env.local` files committed to repository
- [ ] Environment variables validated on startup
- [ ] Backup environment variable storage secured

**Security Headers:**
- [ ] HSTS enabled in production
- [ ] CSP policy tested and validated
- [ ] Security headers verified with security scanners

**Rate Limiting:**
- [ ] Rate limits appropriate for production traffic
- [ ] Monitoring alerts configured for rate limit violations
- [ ] IP allowlisting configured if needed

**Input Validation:**
- [ ] All API endpoints protected with validation
- [ ] XSS detection active and monitored
- [ ] Content sanitization tested with malicious inputs

### Security Testing

**Manual Testing:**
1. **XSS Testing**: Attempt script injection in all input fields
2. **Rate Limiting**: Exceed limits and verify 429 responses
3. **Header Verification**: Check security headers with browser dev tools
4. **Environment Testing**: Verify no sensitive data in client-side code

**Automated Testing:**
```bash
# Security header verification
npm run test:security-headers

# Rate limiting tests
npm run test:rate-limits

# Input validation tests
npm run test:input-validation
```

## 🔧 Configuration Reference

### Rate Limit Configuration

```typescript
// lib/rate-limit.ts
export const apiRateLimiter = new RateLimiter({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 60, // 60 requests per minute
});

export const strictRateLimiter = new RateLimiter({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 10, // 10 requests per minute
});
```

### Validation Configuration

```typescript
// services/backend.ts
private readonly validationConfig: BackendValidationConfig = {
  skipInputValidation: false,
  skipOutputValidation: false,
  continueOnWarnings: true,
  enableAutoFix: false,
  includeMetrics: false,
};
```

### Security Header Configuration

```typescript
// middleware.ts - CSP can be customized per environment
const csp = [
  "default-src 'self'",
  // Add/modify directives as needed
].join('; ');
```

## 📚 References

- [Next.js Security Guide](https://nextjs.org/docs/app/guides/data-security)
- [OWASP Top 10 2021](https://owasp.org/Top10/)
- [Content Security Policy Reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [Rate Limiting Best Practices](https://tools.ietf.org/html/rfc6585#section-4)

## 🔄 Updates & Maintenance

**Security Review Schedule:**
- **Monthly**: Review rate limits and adjust based on usage
- **Quarterly**: Update dependencies and security patches
- **Annually**: Full security audit and penetration testing

**Git Commits Reference:**
- `8ce0e10`: Security headers middleware and API rate limiting
- `9286dcd`: Enhanced input validation and sanitization
- `21179ba`: Documentation updates and task completion

**Last Updated**: September 21, 2024
**Next Review**: October 21, 2024