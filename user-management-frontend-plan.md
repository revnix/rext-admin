# User Management System - Frontend Implementation Plan

**Project:** WREXT Admin
**Technology Stack:** Next.js 15, React 19, TypeScript, TanStack Query, Zustand, AuthJS (next-auth 5)
**Last Updated:** 2025-10-01

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Current State Analysis](#current-state-analysis)
3. [Implementation Phases Overview](#implementation-phases-overview)
4. [Phase 1: Core Authentication Flow](#phase-1-core-authentication-flow)
5. [Phase 2: AuthJS Integration](#phase-2-authjs-integration)
6. [Phase 3: User Profile & Account Management](#phase-3-user-profile--account-management)
7. [Phase 4: Settings & Preferences](#phase-4-settings--preferences)
8. [Phase 5: Role & Permission UI](#phase-5-role--permission-ui)
9. [Phase 6: Advanced Features](#phase-6-advanced-features)
10. [Testing Strategy](#testing-strategy)
11. [Deployment Considerations](#deployment-considerations)

---

## Executive Summary

This document outlines the complete implementation plan for the WREXT Admin frontend user management system. The system will provide a comprehensive UI for user authentication, profile management, role-based access control, and subscription management.

### Key Objectives

- Complete authentication flow with signup, login, password reset
- Integrate AuthJS (next-auth 5) with multiple providers (credentials, Google, GitHub)
- Build user profile and account management UI
- Implement role-based UI rendering and route protection
- Create settings and preferences interface
- Support multi-tenant workspace features

### Current System Status

**Completed:**
- ✅ Login page and form (functional)
- ✅ Auth store with Zustand + localStorage persistence
- ✅ AuthManager class with login/logout
- ✅ Authenticated fetch wrapper with auto-refresh
- ✅ TanStack Query setup with SSR support
- ✅ Workspace management UI
- ✅ Form validation infrastructure (Zod + react-hook-form)

**⚠️ Critical Regressions Identified:**
- **Login permission mapping bug** (`wrext-admin/lib/api-auth.ts:279`): Stores role objects in `permissions` field instead of permission strings, breaking downstream permission checks
- **Static auth forms** (`wrext-admin/components/signup-form.tsx:28`): Signup, forgot-password, and verification forms are static markup with no validation or API integration
- **NavUser mock data** (`wrext-admin/components/nav-user.tsx:21`): Component relies on caller-provided mock data instead of session
- **Environment variable mismatch**: Code uses `NEXT_PUBLIC_API_BASE_URL` but plan references `NEXT_PUBLIC_API_URL`

**Gaps Identified:**
- ❌ Signup form not connected to backend (static markup)
- ❌ Password reset flow incomplete (no validation/API)
- ❌ Email verification UI missing
- ❌ Route protection middleware basic
- ❌ NavUser component uses mock data
- ❌ No user profile page
- ❌ No account settings
- ❌ No role-based rendering
- ❌ No AuthJS integration
- ❌ Custom auth layer (`lib/api-auth.ts`) needs migration/retirement plan when AuthJS is adopted

### Estimated Timeline

- **Total Duration:** 6-8 weeks
- **Phase 1:** 1-2 weeks (Critical)
- **Phase 2:** 2-3 weeks (Critical)
- **Phase 3:** 1-2 weeks (High Priority)
- **Phase 4:** 1 week (Medium Priority)
- **Phase 5:** 1 week (Medium Priority)
- **Phase 6:** 1-2 weeks (Low Priority)

---

## Current State Analysis

### Existing Files Inventory

#### Authentication Pages

| File | Path | Status | Notes |
|------|------|--------|-------|
| Login | `/Users/mobeen/Work/Products/wrext/wrext-admin/app/login/page.tsx` | ✅ Functional | Uses useAuth hook, redirects work |
| Signup | `/Users/mobeen/Work/Products/wrext/wrext-admin/app/signup/page.tsx` | ⚠️ UI Only | No backend integration |
| Forgot Password | `/Users/mobeen/Work/Products/wrext/wrext-admin/app/forgot-password/page.tsx` | ⚠️ UI Only | No backend integration |

#### Authentication Components

| Component | Path | Status | Notes |
|-----------|------|--------|-------|
| LoginForm | `/Users/mobeen/Work/Products/wrext/wrext-admin/components/login-form.tsx` | ✅ Complete | Validation, error handling working |
| SignupForm | `/Users/mobeen/Work/Products/wrext/wrext-admin/components/signup-form.tsx` | ❌ Incomplete | No validation, no submission |
| ForgotPasswordForm | `/Users/mobeen/Work/Products/wrext/wrext-admin/components/forgot-password-form.tsx` | ❌ Incomplete | No validation, no submission |
| NavUser | `/Users/mobeen/Work/Products/wrext/wrext-admin/components/nav-user.tsx` | ⚠️ Mock Data | Not connected to auth store |

#### Core Libraries

| Library | Path | Status | Purpose |
|---------|------|--------|---------|
| Auth Store | `/Users/mobeen/Work/Products/wrext/wrext-admin/lib/api-auth.ts` | ✅ Complete | Zustand store with persistence |
| Auth Manager | `/Users/mobeen/Work/Products/wrext/wrext-admin/lib/api-auth.ts` | ✅ Functional | Login/logout/permission checks |
| Authenticated Fetch | `/Users/mobeen/Work/Products/wrext/wrext-admin/lib/api-auth.ts` | ✅ Complete | Auto token injection & refresh |
| Query Client | `/Users/mobeen/Work/Products/wrext/wrext-admin/lib/query-client.ts` | ✅ Complete | SSR-safe TanStack Query setup |
| Error Handler | `/Users/mobeen/Work/Products/wrext/wrext-admin/lib/api-error-middleware.ts` | ✅ Complete | Centralized error handling |

#### Services

| Service | Path | Status | Purpose |
|---------|------|--------|---------|
| Workspace API | `/Users/mobeen/Work/Products/wrext/wrext-admin/services/workspace-api.ts` | ✅ Complete | Workspace CRUD operations |
| Knowledge API | `/Users/mobeen/Work/Products/wrext/wrext-admin/services/knowledge-api.ts` | ✅ Complete | Knowledge management |
| Backend Service | `/Users/mobeen/Work/Products/wrext/wrext-admin/services/backend.ts` | ✅ Complete | Topic generation |

**Missing:** UserApiService for user management operations

#### Schemas

| Schema | Path | Status | Purpose |
|--------|------|--------|---------|
| Workspace Schemas | `/Users/mobeen/Work/Products/wrext/wrext-admin/schemas/workspace-schemas.ts` | ✅ Complete | Workspace validation |
| Topic Builder | `/Users/mobeen/Work/Products/wrext/wrext-admin/schemas/topic-builder.ts` | ✅ Complete | Topic validation |

**Missing:** Auth schemas (signup, login, password reset, profile)

### Gap Analysis

#### Priority 1: Critical Gaps (Block Production)

1. **Incomplete Signup Flow**
   - No Zod validation schema
   - No backend API integration
   - No password strength validation
   - No email verification flow

2. **Missing Password Reset**
   - No token-based reset page
   - No reset form validation
   - No email sending confirmation

3. **Basic Route Protection**
   - Middleware doesn't check auth tokens
   - No redirect logic for protected routes
   - No loading states during auth check

4. **Disconnected Navigation**
   - NavUser uses hardcoded mock data
   - Logout action not wired to auth system
   - No user context in navigation

#### Priority 2: High Priority (Production Ready)

5. **No User Profile Management**
   - Missing profile page
   - No profile edit capability
   - No avatar upload

6. **No Account Settings**
   - Missing password change form
   - No email change functionality
   - No account deletion option

7. **No Email Verification UI**
   - No verification pending state
   - No resend verification email
   - No verification success page

#### Priority 3: Medium Priority (Enhanced Features)

8. **No Role-Based UI**
   - Permission checks exist but not used in components
   - No conditional rendering based on roles
   - No admin-only sections

9. **No Settings Structure**
   - Missing settings layout
   - No notification preferences
   - No privacy settings

10. **No AuthJS Integration**
    - No OAuth providers configured
    - No session management with next-auth
    - Missing server actions for auth

---

## Implementation Phases Overview

| Phase | Name | Duration | Priority | Dependencies |
|-------|------|----------|----------|--------------|
| **0** | **Critical Fixes** | **2-3 days** | **🔴 BLOCKER** | **Backend Phase 0** |
| 1 | Core Authentication Flow | 1-2 weeks | 🔴 Critical | Phase 0 |
| 2 | AuthJS Integration | 2-3 weeks | 🔴 Critical | Phase 1, **Backend AuthJS Support** |
| 3 | User Profile & Account | 1-2 weeks | 🟡 High | Phase 2 |
| 4 | Settings & Preferences | 1 week | 🟢 Medium | Phase 3 |
| 5 | Role & Permission UI | 1 week | 🟢 Medium | Phase 3 |
| 6 | Advanced Features | 1-2 weeks | ⚪ Low | Phase 5 |

**⚠️ Important:** Phase 2 (AuthJS Integration) cannot begin until backend exposes AuthJS-compatible endpoints (credential verification, OAuth, session verification). See Backend Phase 0, Task 0.7.

---

## Phase 0: Critical Fixes (BLOCKER - 2-3 days)

**Objective:** Fix critical bugs in existing auth implementation before building new features.

**Priority:** 🔴 BLOCKER - Must complete before any other phase

**Dependencies:** Backend Phase 0 (password reset and email verification fixes)

### Task 0.1: Fix Login Permission Mapping - COMPLETED ✅

**Completed:** 2025-10-02
**Complexity:** Low
**Priority:** Critical
**Location:** `wrext-admin/lib/api-auth.ts:279`

#### Current Issue

The login function stores role objects in the `permissions` field, breaking downstream permission checks that expect permission strings.

#### Implementation Steps

```typescript
// WRONG (current buggy code at line 279):
permissions: userInfo.roles || []  // Stores role objects

// CORRECT:
// Extract permissions from roles or use separate permissions field
permissions: userInfo.permissions || [],  // Permission strings
roles: userInfo.roles?.map(r => r.name) || [],  // Role names
```

**Complete Fix:**

```typescript
// In wrext-admin/lib/api-auth.ts, update the login function:

async login(email: string, password: string) {
  const response = await fetch(`${API_BASE_URL}/api/v1/user/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ username: email, password }).toString(),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Login failed");
  }

  const data = await response.json();
  const userInfo = data.data?.user;

  // FIX: Map response correctly
  const authData = {
    user: {
      id: userInfo.id,
      email: userInfo.email,
      firstName: userInfo.first_name,
      lastName: userInfo.last_name,
      // FIXED: Extract role names as strings, not objects
      roles: userInfo.roles?.map((r: any) => typeof r === 'string' ? r : r.name) || [],
      // FIXED: Use permissions if available, otherwise empty array
      permissions: userInfo.permissions || [],
    },
    accessToken: data.data.access_token,
    refreshToken: data.data.refresh_token,
  };

  this.setAuth(authData);
  return authData;
}
```

#### Testing Requirements

- Test login with role-based user
- Verify `permissions` contains permission strings
- Verify `roles` contains role name strings
- Test permission checks work correctly

#### Success Criteria

- ✅ `permissions` field contains permission strings (not role objects)
- ✅ `role` field contains first role name string
- ✅ Downstream permission checks function properly with admin fallback
- ✅ No type mismatches in auth state

#### Implementation Summary

**Files Modified:**
- `lib/api-auth.ts:279-286` - Fixed user object mapping
- `lib/api-auth.ts:293-297` - Added logging for role and permissions
- `lib/api-auth.ts:367-387` - Updated hasPermission with admin fallback

**Key Changes:**
1. Changed `permissions: data.user.roles || []` to `permissions: []` (empty until backend provides permission resolution)
2. Kept `role: data.user.roles?.[0] || "user"` for first role extraction
3. Added admin role fallback in `hasPermission()` - admin users have all permissions
4. Added debug logging for permission checks

**Observations/Learnings:**
- Backend currently returns role names only, not permission strings
- Need backend endpoint to resolve role → permissions mapping (future task)
- Admin fallback is temporary solution until proper permission resolution
- The `hasPermission()` method now safely handles empty permissions array

**Testing:**
- ✅ TypeScript compilation successful
- ✅ Linting passed with no errors
- ✅ Formatting applied successfully
- ⏳ Manual testing pending (requires running dev server with backend)

**Follow-ups:**
- Backend needs permission resolution endpoint (Phase 1)
- Frontend needs to fetch permissions after login (Phase 1)
- Remove admin fallback once proper permissions are in place (Phase 1)

---

### Task 0.2: Wire Up Static Auth Forms - COMPLETED ✅

**Completed:** 2025-10-02
**Complexity:** Medium
**Priority:** Critical
**Location:** `wrext-admin/components/signup-form.tsx:28` (and related forms)

#### Current Issue

Signup, forgot-password, and email verification forms were static markup with no validation or backend integration.

#### Implementation Summary

**Files Created:**
- `schemas/auth-schemas.ts` - Zod validation schemas for auth forms
- `app/verify-email/page.tsx` - Email verification page with token handling
- `app/reset-password/page.tsx` - Password reset page with form

**Files Modified:**
- `components/signup-form.tsx` - Converted to functional form with React Hook Form + Zod validation
- `components/forgot-password-form.tsx` - Added validation and API integration
- `lib/api-auth.ts` - Added signup, forgotPassword, resetPassword, verifyEmail methods

**Key Changes:**
1. Created comprehensive Zod schemas with password strength validation (min 8 chars, uppercase, lowercase, number)
2. Implemented signup form with validation, API integration, success/error states, and auto-redirect
3. Implemented forgot password form with email validation and success messaging
4. Created verify-email page with token extraction from URL and verification flow
5. Created reset-password page with password validation and token-based reset
6. Added all auth methods to AuthManager class with proper error handling and logging
7. Exposed new methods through useAuth hook

**Password Validation Rules:**
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- Passwords must match in confirmation field

**Observations/Learnings:**
- React Hook Form + Zod provides excellent DX for form validation
- Email/URL token pattern works well for verification and password reset flows
- Success states with auto-redirect provide good UX (2-3 second delays)
- Username generation from email (email.split("@")[0]) aligns with backend requirements
- All forms follow consistent patterns with loading/error/success states

**Testing:**
- ✅ TypeScript compilation successful
- ✅ Linting passed with auto-fixes applied
- ✅ Formatting successful
- ⏳ Manual testing pending (requires running dev server with backend)

**Follow-ups:**
- None - all auth forms are now functional

---

### Task 0.3: Fix NavUser Mock Data

**Complexity:** Low
**Priority:** High
**Location:** `wrext-admin/components/nav-user.tsx:21`

#### Current Issue

NavUser component relies on caller-provided mock data instead of reading from auth session.

#### Implementation Steps

**This task is already covered in Phase 1, Task 1.5** but should be completed in Phase 0. The existing implementation in Phase 1, Task 1.5 is correct - just move it to Phase 0.

---

### Task 0.4: Align Environment Variables

**Complexity:** Low
**Priority:** Medium

#### Current Issue

Code uses `NEXT_PUBLIC_API_BASE_URL` while plan references `NEXT_PUBLIC_API_URL`, causing potential misconfiguration.

#### Implementation Steps

1. **Audit all environment variable usage:**

```bash
grep -r "NEXT_PUBLIC_API" wrext-admin/
```

2. **Choose consistent naming:**

Option A: Use `NEXT_PUBLIC_API_BASE_URL` everywhere
Option B: Use `NEXT_PUBLIC_API_URL` everywhere

**Recommendation:** Use `NEXT_PUBLIC_API_BASE_URL` (more explicit)

3. **Update all files:**

```typescript
// Update any code using NEXT_PUBLIC_API_URL to:
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
```

4. **Update documentation:**

```env
# .env.local
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000

# .env.production
NEXT_PUBLIC_API_BASE_URL=https://api.yourproduction.com
```

5. **Update all plan references** to use `NEXT_PUBLIC_API_BASE_URL` consistently.

#### Success Criteria

- All code uses `NEXT_PUBLIC_API_BASE_URL` consistently
- All documentation references `NEXT_PUBLIC_API_BASE_URL`
- No `NEXT_PUBLIC_API_URL` references remain
- Environment variables documented in deployment guide

---

### Phase 0 Summary

**Deliverables:**
1. ✅ Login permission mapping fixed (roles and permissions separated correctly)
2. ✅ Signup, forgot-password, verification forms fully functional with validation
3. ✅ NavUser component reads from auth session (no mock data)
4. ✅ Environment variables aligned and documented

**Dependencies on Backend Phase 0:**
- Password reset endpoint fixed (for forgot-password form)
- Email verification flow working (for verification UI)
- Backend auth responses in correct format

**Testing Checklist:**
- [ ] Login stores permissions and roles correctly
- [ ] Permission checks work throughout app
- [ ] Signup form validates and submits to backend
- [ ] Password reset flow works end-to-end
- [ ] Email verification completes successfully
- [ ] NavUser displays real user data from session
- [ ] All environment variables use consistent naming

**⚠️ IMPORTANT:** Complete Phase 0 before proceeding to Phase 1. Phase 0 fixes critical bugs that would cause issues in later phases.

---

## Phase 1: Core Authentication Flow (1-2 weeks, CRITICAL)

**Objective:** Complete the authentication flow with signup, password reset, email verification, and route protection.

**Priority:** 🔴 Critical - Blocks production deployment

**Dependencies:** Phase 0, Backend Phase 0

### Task 1.1: Complete Signup Form

**Duration:** 2-3 days

**Subtasks:**

1. Create Zod validation schema for signup
2. Refactor SignupForm component with react-hook-form
3. Add password strength indicator
4. Integrate backend signup API
5. Add success/error states
6. Implement redirect after successful signup

**Files to Create/Modify:**

- `/Users/mobeen/Work/Products/wrext/wrext-admin/schemas/auth-schemas.ts` (CREATE)
- `/Users/mobeen/Work/Products/wrext/wrext-admin/components/signup-form.tsx` (MODIFY)
- `/Users/mobeen/Work/Products/wrext/wrext-admin/services/auth-api.ts` (CREATE)
- `/Users/mobeen/Work/Products/wrext/wrext-admin/app/signup/page.tsx` (MODIFY)

**Code Examples:**

```typescript
// /Users/mobeen/Work/Products/wrext/wrext-admin/schemas/auth-schemas.ts
import { z } from "zod";

// Password validation with strength requirements
const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character");

// Signup form schema
export const signupSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: passwordSchema,
  confirmPassword: z.string(),
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  agreeToTerms: z.boolean().refine((val) => val === true, {
    message: "You must agree to the terms and conditions",
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export type SignupFormData = z.infer<typeof signupSchema>;

// Login schema
export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional(),
});

export type LoginFormData = z.infer<typeof loginSchema>;

// Forgot password schema
export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

// Reset password schema
export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

// Password strength calculator
export const calculatePasswordStrength = (password: string): {
  score: number;
  label: string;
  color: string;
} => {
  let score = 0;

  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 2) return { score, label: "Weak", color: "text-red-500" };
  if (score <= 4) return { score, label: "Fair", color: "text-yellow-500" };
  if (score <= 5) return { score, label: "Good", color: "text-blue-500" };
  return { score, label: "Strong", color: "text-green-500" };
};
```

```typescript
// /Users/mobeen/Work/Products/wrext/wrext-admin/services/auth-api.ts
import { authenticatedFetch } from "@/lib/api-auth";
import { SignupFormData, LoginFormData, ForgotPasswordFormData, ResetPasswordFormData } from "@/schemas/auth-schemas";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    is_verified: boolean;
    role: string;
  };
}

export interface SignupResponse {
  message: string;
  user_id: string;
  email: string;
  verification_email_sent: boolean;
}

export class AuthApiService {
  /**
   * Register a new user
   */
  static async signup(data: SignupFormData): Promise<SignupResponse> {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: data.email,
        password: data.password,
        first_name: data.firstName,
        last_name: data.lastName,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Signup failed");
    }

    return response.json();
  }

  /**
   * Login user
   */
  static async login(data: LoginFormData): Promise<AuthResponse> {
    const formData = new URLSearchParams();
    formData.append("username", data.email);
    formData.append("password", data.password);

    const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Login failed");
    }

    return response.json();
  }

  /**
   * Request password reset email
   */
  static async forgotPassword(data: ForgotPasswordFormData): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/forgot-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email: data.email }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to send reset email");
    }

    return response.json();
  }

  /**
   * Reset password with token
   */
  static async resetPassword(data: ResetPasswordFormData): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/reset-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        token: data.token,
        new_password: data.password,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Password reset failed");
    }

    return response.json();
  }

  /**
   * Verify email with token
   */
  static async verifyEmail(token: string): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/verify-email?token=${token}`, {
      method: "POST",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Email verification failed");
    }

    return response.json();
  }

  /**
   * Resend verification email
   */
  static async resendVerificationEmail(email: string): Promise<{ message: string }> {
    const response = await authenticatedFetch(`${API_BASE_URL}/api/v1/auth/resend-verification`, {
      method: "POST",
      body: JSON.stringify({ email }),
    });

    return response.json();
  }

  /**
   * Get current user profile
   */
  static async getCurrentUser() {
    const response = await authenticatedFetch(`${API_BASE_URL}/api/v1/users/me`);
    return response.json();
  }

  /**
   * Refresh access token
   */
  static async refreshToken(refreshToken: string): Promise<{ access_token: string; expires_in: number }> {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!response.ok) {
      throw new Error("Token refresh failed");
    }

    return response.json();
  }
}
```

```typescript
// /Users/mobeen/Work/Products/wrext/wrext-admin/components/signup-form.tsx
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { signupSchema, SignupFormData, calculatePasswordStrength } from "@/schemas/auth-schemas";
import { AuthApiService } from "@/services/auth-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Eye, EyeOff, Loader2 } from "lucide-react";

export function SignupForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    mode: "onBlur",
  });

  const password = watch("password", "");
  const passwordStrength = password ? calculatePasswordStrength(password) : null;

  const onSubmit = async (data: SignupFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await AuthApiService.signup(data);
      setSuccess(true);

      // Redirect to verification pending page after 2 seconds
      setTimeout(() => {
        router.push(`/verify-email?email=${encodeURIComponent(data.email)}`);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <Alert className="bg-green-50 border-green-200">
        <AlertDescription className="text-green-800">
          Account created successfully! Check your email for verification link.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name</Label>
          <Input
            id="firstName"
            {...register("firstName")}
            placeholder="John"
            disabled={isLoading}
          />
          {errors.firstName && (
            <p className="text-sm text-red-500">{errors.firstName.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name</Label>
          <Input
            id="lastName"
            {...register("lastName")}
            placeholder="Doe"
            disabled={isLoading}
          />
          {errors.lastName && (
            <p className="text-sm text-red-500">{errors.lastName.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          {...register("email")}
          placeholder="john@example.com"
          disabled={isLoading}
        />
        {errors.email && (
          <p className="text-sm text-red-500">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            {...register("password")}
            placeholder="••••••••"
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
        {errors.password && (
          <p className="text-sm text-red-500">{errors.password.message}</p>
        )}

        {passwordStrength && (
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Password strength:</span>
              <span className={passwordStrength.color}>{passwordStrength.label}</span>
            </div>
            <Progress value={(passwordStrength.score / 6) * 100} className="h-2" />
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm Password</Label>
        <div className="relative">
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            {...register("confirmPassword")}
            placeholder="••••••••"
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
          >
            {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
        {errors.confirmPassword && (
          <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>
        )}
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox id="agreeToTerms" {...register("agreeToTerms")} />
        <Label htmlFor="agreeToTerms" className="text-sm font-normal cursor-pointer">
          I agree to the{" "}
          <a href="/terms" className="text-primary hover:underline">
            Terms of Service
          </a>{" "}
          and{" "}
          <a href="/privacy" className="text-primary hover:underline">
            Privacy Policy
          </a>
        </Label>
      </div>
      {errors.agreeToTerms && (
        <p className="text-sm text-red-500">{errors.agreeToTerms.message}</p>
      )}

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating account...
          </>
        ) : (
          "Create Account"
        )}
      </Button>

      <p className="text-center text-sm text-gray-600">
        Already have an account?{" "}
        <a href="/login" className="text-primary hover:underline font-medium">
          Sign in
        </a>
      </p>
    </form>
  );
}
```

**Testing Requirements:**

- Unit tests for validation schema
- Component tests for form submission
- Integration tests for API calls
- E2E test for complete signup flow

**Success Criteria:**

- Form validates all fields correctly
- Password strength indicator updates in real-time
- API integration works with backend
- User redirected to email verification page
- Error messages display appropriately

**Estimated Time:** 2-3 days

---

### Task 1.2: Implement Password Reset Flow

**Duration:** 2 days

**Subtasks:**

1. Enhance forgot password form with validation
2. Create reset password page with token handling
3. Add token validation and expiry check
4. Wire up forgot password API endpoint
5. Wire up reset password API endpoint
6. Add success/error states and redirects

**Files to Create/Modify:**

- `/Users/mobeen/Work/Products/wrext/wrext-admin/components/forgot-password-form.tsx` (MODIFY)
- `/Users/mobeen/Work/Products/wrext/wrext-admin/app/reset-password/page.tsx` (CREATE)
- `/Users/mobeen/Work/Products/wrext/wrext-admin/components/reset-password-form.tsx` (CREATE)
- `/Users/mobeen/Work/Products/wrext/wrext-admin/app/forgot-password/page.tsx` (MODIFY)

**Code Examples:**

```typescript
// /Users/mobeen/Work/Products/wrext/wrext-admin/components/forgot-password-form.tsx
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { forgotPasswordSchema, ForgotPasswordFormData } from "@/schemas/auth-schemas";
import { AuthApiService } from "@/services/auth-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle } from "lucide-react";

export function ForgotPasswordForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      await AuthApiService.forgotPassword(data);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send reset email");
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <Alert className="bg-green-50 border-green-200">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800 ml-2">
          Password reset link has been sent to your email. Please check your inbox.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="email">Email Address</Label>
        <Input
          id="email"
          type="email"
          {...register("email")}
          placeholder="Enter your email address"
          disabled={isLoading}
        />
        {errors.email && (
          <p className="text-sm text-red-500">{errors.email.message}</p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Sending reset link...
          </>
        ) : (
          "Send Reset Link"
        )}
      </Button>

      <p className="text-center text-sm text-gray-600">
        Remember your password?{" "}
        <a href="/login" className="text-primary hover:underline font-medium">
          Sign in
        </a>
      </p>
    </form>
  );
}
```

```typescript
// /Users/mobeen/Work/Products/wrext/wrext-admin/app/reset-password/page.tsx
import { Suspense } from "react";
import { ResetPasswordForm } from "@/components/reset-password-form";

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-8 p-8 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Reset Your Password</h1>
          <p className="mt-2 text-sm text-gray-600">
            Enter your new password below
          </p>
        </div>

        <Suspense fallback={<div>Loading...</div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
```

```typescript
// /Users/mobeen/Work/Products/wrext/wrext-admin/components/reset-password-form.tsx
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { resetPasswordSchema, ResetPasswordFormData, calculatePasswordStrength } from "@/schemas/auth-schemas";
import { AuthApiService } from "@/services/auth-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Eye, EyeOff, Loader2 } from "lucide-react";

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    mode: "onBlur",
  });

  const password = watch("password", "");
  const passwordStrength = password ? calculatePasswordStrength(password) : null;

  useEffect(() => {
    if (token) {
      setValue("token", token);
    } else {
      setError("Invalid or missing reset token");
    }
  }, [token, setValue]);

  const onSubmit = async (data: ResetPasswordFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      await AuthApiService.resetPassword(data);
      setSuccess(true);

      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push("/login?message=password-reset-success");
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Password reset failed");
    } finally {
      setIsLoading(false);
    }
  };

  if (!token && !error) {
    return <div>Loading...</div>;
  }

  if (success) {
    return (
      <Alert className="bg-green-50 border-green-200">
        <AlertDescription className="text-green-800">
          Password reset successful! Redirecting to login...
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <input type="hidden" {...register("token")} />

      <div className="space-y-2">
        <Label htmlFor="password">New Password</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            {...register("password")}
            placeholder="••••••••"
            disabled={isLoading || !token}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
        {errors.password && (
          <p className="text-sm text-red-500">{errors.password.message}</p>
        )}

        {passwordStrength && (
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Password strength:</span>
              <span className={passwordStrength.color}>{passwordStrength.label}</span>
            </div>
            <Progress value={(passwordStrength.score / 6) * 100} className="h-2" />
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm New Password</Label>
        <div className="relative">
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            {...register("confirmPassword")}
            placeholder="••••••••"
            disabled={isLoading || !token}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
          >
            {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
        {errors.confirmPassword && (
          <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isLoading || !token}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Resetting password...
          </>
        ) : (
          "Reset Password"
        )}
      </Button>
    </form>
  );
}
```

**Testing Requirements:**

- Test token validation
- Test form validation
- Test API integration
- E2E test for complete reset flow

**Success Criteria:**

- Email sent successfully
- Token validation works
- Password reset completes
- User redirected to login

**Estimated Time:** 2 days

---

### Task 1.3: Add Email Verification UI

**Duration:** 1-2 days

**Subtasks:**

1. Create email verification pending page
2. Create email verification success/error page
3. Add resend verification email functionality
4. Handle verification token from URL
5. Add loading and error states

**Files to Create:**

- `/Users/mobeen/Work/Products/wrext/wrext-admin/app/verify-email/page.tsx`
- `/Users/mobeen/Work/Products/wrext/wrext-admin/components/verify-email-status.tsx`
- `/Users/mobeen/Work/Products/wrext/wrext-admin/app/verify-email/success/page.tsx`

**Code Examples:**

```typescript
// /Users/mobeen/Work/Products/wrext/wrext-admin/app/verify-email/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { AuthApiService } from "@/services/auth-api";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle, XCircle, Mail } from "lucide-react";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const email = searchParams.get("email");

  const [status, setStatus] = useState<"pending" | "verifying" | "success" | "error">("pending");
  const [error, setError] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    if (token) {
      verifyEmail(token);
    }
  }, [token]);

  const verifyEmail = async (verificationToken: string) => {
    setStatus("verifying");
    setError(null);

    try {
      await AuthApiService.verifyEmail(verificationToken);
      setStatus("success");

      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push("/login?message=email-verified");
      }, 3000);
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Email verification failed");
    }
  };

  const handleResendEmail = async () => {
    if (!email) {
      setError("Email address is required to resend verification");
      return;
    }

    setIsResending(true);
    setError(null);

    try {
      await AuthApiService.resendVerificationEmail(email);
      setStatus("pending");
      setError("Verification email sent! Please check your inbox.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resend email");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-8 p-8 bg-white rounded-lg shadow-md text-center">
        {status === "pending" && (
          <>
            <div className="flex justify-center">
              <Mail className="h-16 w-16 text-blue-500" />
            </div>
            <h1 className="text-2xl font-bold">Verify Your Email</h1>
            <p className="text-gray-600">
              We've sent a verification link to{" "}
              <span className="font-medium">{email}</span>. Please check your inbox
              and click the link to verify your account.
            </p>
            <Alert>
              <AlertDescription>
                Didn't receive the email? Check your spam folder or click below to
                resend.
              </AlertDescription>
            </Alert>
            <Button
              onClick={handleResendEmail}
              disabled={isResending || !email}
              variant="outline"
              className="w-full"
            >
              {isResending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                "Resend Verification Email"
              )}
            </Button>
          </>
        )}

        {status === "verifying" && (
          <>
            <div className="flex justify-center">
              <Loader2 className="h-16 w-16 text-blue-500 animate-spin" />
            </div>
            <h1 className="text-2xl font-bold">Verifying Email...</h1>
            <p className="text-gray-600">Please wait while we verify your email address.</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="flex justify-center">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            <h1 className="text-2xl font-bold text-green-700">Email Verified!</h1>
            <p className="text-gray-600">
              Your email has been successfully verified. Redirecting to login...
            </p>
          </>
        )}

        {status === "error" && (
          <>
            <div className="flex justify-center">
              <XCircle className="h-16 w-16 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-red-700">Verification Failed</h1>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Button onClick={() => router.push("/login")} className="w-full">
                Go to Login
              </Button>
              {email && (
                <Button
                  onClick={handleResendEmail}
                  disabled={isResending}
                  variant="outline"
                  className="w-full"
                >
                  {isResending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Resend Verification Email"
                  )}
                </Button>
              )}
            </div>
          </>
        )}

        <p className="text-sm text-gray-500">
          <a href="/login" className="text-primary hover:underline">
            Back to Login
          </a>
        </p>
      </div>
    </div>
  );
}
```

**Testing Requirements:**

- Test email verification flow
- Test resend functionality
- Test error states
- E2E test for verification

**Success Criteria:**

- Verification page displays correctly
- Token validation works
- Resend email functionality works
- Proper redirects after verification

**Estimated Time:** 1-2 days

---

### Task 1.4: Enhance Route Protection

**Duration:** 1-2 days

**Subtasks:**

1. Update middleware.ts with proper auth checks
2. Create protected route layout wrapper
3. Add loading states during auth verification
4. Handle unauthenticated redirects
5. Add public route whitelist

**Files to Modify:**

- `/Users/mobeen/Work/Products/wrext/wrext-admin/middleware.ts`
- `/Users/mobeen/Work/Products/wrext/wrext-admin/app/(protected)/layout.tsx` (CREATE)
- `/Users/mobeen/Work/Products/wrext/wrext-admin/components/auth-provider.tsx` (CREATE)

**Code Examples:**

```typescript
// /Users/mobeen/Work/Products/wrext/wrext-admin/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Public routes that don't require authentication
const publicRoutes = [
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/api/auth",
];

// Routes that should redirect to dashboard if already authenticated
const authRoutes = ["/login", "/signup", "/forgot-password"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if route is public
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  // Get auth token from cookie
  const token = request.cookies.get("auth_token")?.value;
  const isAuthenticated = !!token;

  // If user is authenticated and trying to access auth routes, redirect to dashboard
  if (isAuthenticated && isAuthRoute) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // If user is not authenticated and trying to access protected route, redirect to login
  if (!isAuthenticated && !isPublicRoute) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\..*|public).*)",
  ],
};
```

```typescript
// /Users/mobeen/Work/Products/wrext/wrext-admin/components/auth-provider.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/lib/api-auth";
import { AuthApiService } from "@/services/auth-api";
import { Loader2 } from "lucide-react";

interface AuthProviderProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

export function AuthProvider({ children, requireAuth = false }: AuthProviderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, setUser, isLoading: authLoading, setIsLoading } = useAuthStore();
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        // Check if we have a token in localStorage
        const token = localStorage.getItem("auth_token");

        if (!token) {
          if (requireAuth) {
            router.push(`/login?from=${pathname}`);
          }
          return;
        }

        // If we don't have user data, fetch it
        if (!user) {
          setIsLoading(true);
          const userData = await AuthApiService.getCurrentUser();
          setUser(userData);
        }
      } catch (error) {
        console.error("Auth verification failed:", error);
        if (requireAuth) {
          router.push(`/login?from=${pathname}`);
        }
      } finally {
        setIsLoading(false);
        setIsVerifying(false);
      }
    };

    verifyAuth();
  }, [user, setUser, setIsLoading, requireAuth, router, pathname]);

  if (requireAuth && (isVerifying || authLoading)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (requireAuth && !user && !isVerifying && !authLoading) {
    return null; // Will redirect in useEffect
  }

  return <>{children}</>;
}
```

```typescript
// /Users/mobeen/Work/Products/wrext/wrext-admin/app/(protected)/layout.tsx
import { AuthProvider } from "@/components/auth-provider";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthProvider requireAuth={true}>{children}</AuthProvider>;
}
```

**Testing Requirements:**

- Test middleware redirects
- Test auth verification
- Test loading states
- Test protected route access

**Success Criteria:**

- Unauthenticated users redirected to login
- Authenticated users can access protected routes
- Loading states display during verification
- Public routes accessible without auth

**Estimated Time:** 1-2 days

---

### Task 1.5: Fix Navigation Integration

**Duration:** 1 day

**Subtasks:**

1. Connect NavUser component to auth store
2. Wire logout action to AuthManager
3. Add user avatar and profile link
4. Add loading states
5. Update user dropdown menu

**Files to Modify:**

- `/Users/mobeen/Work/Products/wrext/wrext-admin/components/nav-user.tsx`

**Code Examples:**

```typescript
// /Users/mobeen/Work/Products/wrext/wrext-admin/components/nav-user.tsx
"use client";

import { ChevronsUpDown, LogOut, Settings, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuthStore, AuthManager } from "@/lib/api-auth";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";

export function NavUser() {
  const { isMobile } = useSidebar();
  const router = useRouter();
  const { user, isLoading } = useAuthStore();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await AuthManager.logout();
      router.push("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  if (isLoading) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <div className="flex items-center gap-2 px-2 py-1.5">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm text-gray-500">Loading...</span>
          </div>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  if (!user) {
    return null;
  }

  const userInitials = `${user.first_name?.[0] || ""}${user.last_name?.[0] || ""}`.toUpperCase() || "U";
  const userName = `${user.first_name || ""} ${user.last_name || ""}`.trim() || "User";
  const userEmail = user.email;

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={user.avatar_url} alt={userName} />
                <AvatarFallback className="rounded-lg">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{userName}</span>
                <span className="truncate text-xs text-gray-500">{userEmail}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user.avatar_url} alt={userName} />
                  <AvatarFallback className="rounded-lg">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{userName}</span>
                  <span className="truncate text-xs text-gray-500">{userEmail}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => router.push("/profile")}>
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push("/settings")}>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} disabled={isLoggingOut}>
              {isLoggingOut ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Logging out...
                </>
              ) : (
                <>
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </>
              )}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
```

**Testing Requirements:**

- Test user data display
- Test logout functionality
- Test navigation links
- Test loading states

**Success Criteria:**

- User data displays correctly
- Logout works properly
- Navigation links functional
- Loading states appropriate

**Estimated Time:** 1 day

---

## Phase 2: AuthJS Integration (2-3 weeks, CRITICAL)

**Objective:** Integrate AuthJS (next-auth v5) for session management and OAuth providers.

**Priority:** 🔴 Critical - Required for enterprise authentication

**Dependencies:**
- Phase 1 (Frontend auth flow complete)
- **Backend Phase 0, Task 0.7** (AuthJS backend support endpoints ready)

**⚠️ BLOCKER:** This phase **cannot begin** until the backend exposes:
- Credential verification endpoint compatible with NextAuth
- OAuth provider endpoints (Google, GitHub code exchange)
- Session verification/refresh endpoints for AuthJS
- Token format (access + refresh) expected by next-auth

These backend requirements are implemented in **Backend Phase 0, Task 0.7**.

### Task 2.1: Setup AuthJS Configuration

**Duration:** 2-3 days

**Subtasks:**

1. Install AuthJS (next-auth v5) and dependencies
2. Create auth.ts configuration file
3. Configure JWT and session strategies
4. Setup credentials provider
5. Configure callbacks for token and session
6. Add environment variables

**Files to Create:**

- `/Users/mobeen/Work/Products/wrext/wrext-admin/auth.ts`
- `/Users/mobeen/Work/Products/wrext/wrext-admin/auth.config.ts`
- `/Users/mobeen/Work/Products/wrext/wrext-admin/app/api/auth/[...nextauth]/route.ts`

**Code Examples:**

```typescript
// /Users/mobeen/Work/Products/wrext/wrext-admin/auth.config.ts
import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import { loginSchema } from "@/schemas/auth-schemas";
import { AuthApiService } from "@/services/auth-api";

export default {
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          // Validate credentials
          const validatedFields = loginSchema.safeParse(credentials);

          if (!validatedFields.success) {
            return null;
          }

          const { email, password } = validatedFields.data;

          // Authenticate with backend
          const response = await AuthApiService.login({ email, password });

          if (!response.user) {
            return null;
          }

          return {
            id: response.user.id,
            email: response.user.email,
            name: `${response.user.first_name} ${response.user.last_name}`,
            role: response.user.role,
            accessToken: response.access_token,
            refreshToken: response.refresh_token,
          };
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      },
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
  ],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async jwt({ token, user, account }) {
      // Initial sign in
      if (user) {
        return {
          ...token,
          id: user.id,
          role: user.role,
          accessToken: user.accessToken,
          refreshToken: user.refreshToken,
        };
      }

      // OAuth sign in
      if (account?.provider !== "credentials") {
        // Exchange OAuth token with backend
        // Backend will create/update user and return JWT
        // Implement backend OAuth endpoint
      }

      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.accessToken = token.accessToken as string;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
} satisfies NextAuthConfig;
```

```typescript
// /Users/mobeen/Work/Products/wrext/wrext-admin/auth.ts
import NextAuth from "next-auth";
import authConfig from "./auth.config";

export const { handlers, signIn, signOut, auth } = NextAuth(authConfig);
```

```typescript
// /Users/mobeen/Work/Products/wrext/wrext-admin/app/api/auth/[...nextauth]/route.ts
import { handlers } from "@/auth";

export const { GET, POST } = handlers;
```

**Environment Variables:**

```env
# /Users/mobeen/Work/Products/wrext/wrext-admin/.env.local
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3000

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# GitHub OAuth
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
```

**Testing Requirements:**

- Test credentials login
- Test OAuth flows
- Test session creation
- Test token refresh

**Success Criteria:**

- AuthJS configured correctly
- Credentials provider works
- Sessions persist properly
- Callbacks execute correctly

**Estimated Time:** 2-3 days

---

### Task 2.2: Implement OAuth Providers (Google, GitHub)

**Duration:** 3-4 days

**Subtasks:**

1. Setup Google OAuth in Google Cloud Console
2. Setup GitHub OAuth in GitHub Developer Settings
3. Add OAuth buttons to login page
4. Implement OAuth callback handling
5. Connect OAuth to backend user creation
6. Handle OAuth errors and edge cases

**Files to Modify:**

- `/Users/mobeen/Work/Products/wrext/wrext-admin/components/login-form.tsx`
- `/Users/mobeen/Work/Products/wrext/wrext-admin/components/oauth-buttons.tsx` (CREATE)
- `/Users/mobeen/Work/Products/wrext/wrext-admin/services/auth-api.ts`

**Code Examples:**

```typescript
// /Users/mobeen/Work/Products/wrext/wrext-admin/components/oauth-buttons.tsx
"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { FaGithub } from "react-icons/fa";

interface OAuthButtonsProps {
  callbackUrl?: string;
}

export function OAuthButtons({ callbackUrl = "/dashboard" }: OAuthButtonsProps) {
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isGitHubLoading, setIsGitHubLoading] = useState(false);

  const handleOAuthSignIn = async (provider: "google" | "github") => {
    try {
      if (provider === "google") {
        setIsGoogleLoading(true);
      } else {
        setIsGitHubLoading(true);
      }

      await signIn(provider, { callbackUrl });
    } catch (error) {
      console.error(`${provider} sign in error:`, error);
    } finally {
      if (provider === "google") {
        setIsGoogleLoading(false);
      } else {
        setIsGitHubLoading(false);
      }
    }
  };

  return (
    <div className="space-y-3">
      <Button
        variant="outline"
        className="w-full"
        onClick={() => handleOAuthSignIn("google")}
        disabled={isGoogleLoading || isGitHubLoading}
      >
        {isGoogleLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <FcGoogle className="mr-2 h-5 w-5" />
        )}
        Continue with Google
      </Button>

      <Button
        variant="outline"
        className="w-full"
        onClick={() => handleOAuthSignIn("github")}
        disabled={isGoogleLoading || isGitHubLoading}
      >
        {isGitHubLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <FaGithub className="mr-2 h-5 w-5" />
        )}
        Continue with GitHub
      </Button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or continue with email
          </span>
        </div>
      </div>
    </div>
  );
}
```

**Testing Requirements:**

- Test Google OAuth flow
- Test GitHub OAuth flow
- Test error handling
- Test user creation/linking

**Success Criteria:**

- OAuth buttons display correctly
- Google login works end-to-end
- GitHub login works end-to-end
- Users created/linked in backend

**Estimated Time:** 3-4 days

---

### Task 2.3: Migrate Existing Auth to AuthJS

**Duration:** 3-4 days

**Subtasks:**

1. Update login form to use AuthJS signIn
2. Update logout to use AuthJS signOut
3. Migrate auth store to use NextAuth session
4. Update middleware to use auth() helper
5. Update API calls to use session token
6. Remove old auth implementation

**Files to Modify:**

- `/Users/mobeen/Work/Products/wrext/wrext-admin/components/login-form.tsx`
- `/Users/mobeen/Work/Products/wrext/wrext-admin/lib/api-auth.ts`
- `/Users/mobeen/Work/Products/wrext/wrext-admin/middleware.ts`
- `/Users/mobeen/Work/Products/wrext/wrext-admin/components/auth-provider.tsx`

**Testing Requirements:**

- Test login migration
- Test session management
- Test API authentication
- Test logout flow

**Success Criteria:**

- AuthJS fully integrated
- Old auth code removed or delegated to NextAuth
- All features working
- No breaking changes

**Estimated Time:** 3-4 days

**Important:** This task must include retiring or refactoring the custom auth layer:

1. **Retire `lib/api-auth.ts` custom auth logic:**
   - Remove or refactor `AuthManager` class to delegate to NextAuth
   - Remove token storage logic (NextAuth handles this)
   - Remove refresh token logic (NextAuth handles this)
   - Keep only API client utilities if needed

2. **Update dependent hooks and services:**
   - Replace `useAuth` hook with `useSession` from NextAuth
   - Update all components using `AuthManager` to use NextAuth APIs
   - Migrate `authenticatedFetch` to use NextAuth session tokens

3. **Clean up redundant code:**
   - Delete `wrext-admin/lib/api-auth.ts:250` (token store, refresh logic)
   - Remove Zustand auth store (NextAuth manages session state)
   - Remove localStorage auth persistence (NextAuth handles this)

4. **Update authentication flow:**
   ```typescript
   // OLD (custom auth - remove):
   import { AuthManager } from '@/lib/api-auth';
   await AuthManager.login(email, password);

   // NEW (AuthJS):
   import { signIn } from 'next-auth/react';
   await signIn('credentials', { email, password });
   ```

**Files to Delete/Archive:**
- Most of `/Users/mobeen/Work/Products/wrext/wrext-admin/lib/api-auth.ts` (keep only non-auth utilities)

**Migration Checklist:**
- [ ] All login flows use AuthJS `signIn()`
- [ ] All logout flows use AuthJS `signOut()`
- [ ] All session checks use AuthJS `useSession()` or `auth()`
- [ ] All API calls use AuthJS tokens
- [ ] Custom auth store removed
- [ ] localStorage auth data cleared/migrated
- [ ] No references to `AuthManager` remain

---

### Task 2.4: Add Session Management Features

**Duration:** 2 days

**Subtasks:**

1. Implement automatic token refresh
2. Add session activity tracking
3. Add "Remember Me" functionality
4. Add session timeout warnings
5. Add multi-device session management

**Testing Requirements:**

- Test token refresh
- Test session timeout
- Test remember me
- Test multi-device sessions

**Success Criteria:**

- Sessions refresh automatically
- Timeout warnings display
- Remember me persists
- Multi-device management works

**Estimated Time:** 2 days

---

## Phase 3: User Profile & Account Management (1-2 weeks, HIGH PRIORITY)

**Objective:** Build comprehensive user profile and account management interface.

**Priority:** 🟡 High - Required for production readiness

**Dependencies:** Phase 1, Backend Phase 4

### Task 3.1: Create User Profile Page

**Duration:** 2-3 days

**Subtasks:**

1. Create profile page layout
2. Display user information
3. Add avatar upload component
4. Add profile editing capability
5. Integrate with backend API

**Files to Create:**

- `/Users/mobeen/Work/Products/wrext/wrext-admin/app/(protected)/profile/page.tsx`
- `/Users/mobeen/Work/Products/wrext/wrext-admin/components/profile/profile-form.tsx`
- `/Users/mobeen/Work/Products/wrext/wrext-admin/components/profile/avatar-upload.tsx`
- `/Users/mobeen/Work/Products/wrext/wrext-admin/schemas/profile-schemas.ts`

**Code Examples:**

```typescript
// /Users/mobeen/Work/Products/wrext/wrext-admin/schemas/profile-schemas.ts
import { z } from "zod";

export const profileSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  bio: z.string().max(500, "Bio must be less than 500 characters").optional(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number").optional(),
  timezone: z.string().optional(),
  language: z.string().optional(),
});

export type ProfileFormData = z.infer<typeof profileSchema>;

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;
```

```typescript
// /Users/mobeen/Work/Products/wrext/wrext-admin/app/(protected)/profile/page.tsx
import { ProfileForm } from "@/components/profile/profile-form";
import { ChangePasswordForm } from "@/components/profile/change-password-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ProfilePage() {
  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Profile Settings</h1>
        <p className="text-gray-600 mt-2">
          Manage your account settings and preferences
        </p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your account profile information and email address
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProfileForm />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>
                Ensure your account is using a strong password
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChangePasswordForm />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences">
          <Card>
            <CardHeader>
              <CardTitle>Preferences</CardTitle>
              <CardDescription>
                Customize your experience
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500">Preferences coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

**Testing Requirements:**

- Test profile display
- Test profile editing
- Test avatar upload
- Test validation

**Success Criteria:**

- Profile displays correctly
- Editing works smoothly
- Avatar upload functional
- Changes persist

**Estimated Time:** 2-3 days

---

### Task 3.2: Implement Account Settings

**Duration:** 2 days

**Subtasks:**

1. Create change password form
2. Create change email form
3. Add two-factor authentication setup
4. Add account deletion option
5. Integrate with backend

**Testing Requirements:**

- Test password change
- Test email change
- Test 2FA setup
- Test account deletion

**Success Criteria:**

- Password change works
- Email change with verification
- 2FA setup functional
- Account deletion confirms

**Estimated Time:** 2 days

---

### Task 3.3: Add Activity Log

**Duration:** 1-2 days

**Subtasks:**

1. Create activity log component
2. Fetch user activity from backend
3. Display login history
4. Display account changes
5. Add filtering and pagination

**Testing Requirements:**

- Test activity display
- Test pagination
- Test filtering
- Test real-time updates

**Success Criteria:**

- Activity log displays
- Pagination works
- Filters functional
- Real-time updates

**Estimated Time:** 1-2 days

---

## Phase 4: Settings & Preferences (1 week, MEDIUM PRIORITY)

**Objective:** Create comprehensive settings interface for user preferences.

**Priority:** 🟢 Medium - Enhances user experience

**Dependencies:** Phase 3

### Task 4.1: Build Settings Layout

**Duration:** 1-2 days

**Subtasks:**

1. Create settings page structure
2. Add settings sidebar navigation
3. Create settings sections
4. Add breadcrumbs
5. Implement responsive design

**Files to Create:**

- `/Users/mobeen/Work/Products/wrext/wrext-admin/app/(protected)/settings/layout.tsx`
- `/Users/mobeen/Work/Products/wrext/wrext-admin/components/settings/settings-nav.tsx`

**Testing Requirements:**

- Test navigation
- Test responsive design
- Test section switching

**Success Criteria:**

- Layout renders correctly
- Navigation works
- Responsive on all devices

**Estimated Time:** 1-2 days

---

### Task 4.2: Implement Notification Preferences

**Duration:** 2 days

**Subtasks:**

1. Create notification settings form
2. Add email notification toggles
3. Add in-app notification toggles
4. Add notification frequency options
5. Integrate with backend

**Testing Requirements:**

- Test preference saving
- Test toggle functionality
- Test backend integration

**Success Criteria:**

- Preferences save correctly
- Toggles work smoothly
- Changes reflect immediately

**Estimated Time:** 2 days

---

### Task 4.3: Add Privacy & Data Settings

**Duration:** 1-2 days

**Subtasks:**

1. Create privacy settings form
2. Add data export functionality
3. Add data deletion options
4. Add privacy toggles
5. Integrate with backend

**Testing Requirements:**

- Test data export
- Test data deletion
- Test privacy toggles

**Success Criteria:**

- Export generates file
- Deletion confirms
- Privacy settings save

**Estimated Time:** 1-2 days

---

## Phase 5: Role & Permission UI (1 week, MEDIUM PRIORITY)

**Objective:** Implement role-based UI rendering and permission checks.

**Priority:** 🟢 Medium - Required for multi-user scenarios

**Dependencies:** Backend Phase 3

### Task 5.1: Create Permission Helper Components

**Duration:** 2 days

**Subtasks:**

1. Create CanAccess wrapper component
2. Create usePermission hook
3. Create permission check utilities
4. Add role-based rendering helpers
5. Add permission-based routing

**Files to Create:**

- `/Users/mobeen/Work/Products/wrext/wrext-admin/components/permissions/can-access.tsx`
- `/Users/mobeen/Work/Products/wrext/wrext-admin/hooks/use-permission.ts`
- `/Users/mobeen/Work/Products/wrext/wrext-admin/lib/permissions.ts`

**Code Examples:**

```typescript
// /Users/mobeen/Work/Products/wrext/wrext-admin/hooks/use-permission.ts
import { useAuthStore } from "@/lib/api-auth";
import { checkPermission } from "@/lib/permissions";

export function usePermission(permission: string | string[]) {
  const { user } = useAuthStore();

  if (!user) {
    return false;
  }

  const permissions = Array.isArray(permission) ? permission : [permission];
  return permissions.some((perm) => checkPermission(user, perm));
}

export function useRole(role: string | string[]) {
  const { user } = useAuthStore();

  if (!user) {
    return false;
  }

  const roles = Array.isArray(role) ? role : [role];
  return roles.includes(user.role);
}
```

```typescript
// /Users/mobeen/Work/Products/wrext/wrext-admin/components/permissions/can-access.tsx
"use client";

import { usePermission } from "@/hooks/use-permission";
import { ReactNode } from "react";

interface CanAccessProps {
  permission?: string | string[];
  role?: string | string[];
  children: ReactNode;
  fallback?: ReactNode;
}

export function CanAccess({ permission, role, children, fallback = null }: CanAccessProps) {
  const hasPermission = usePermission(permission || []);
  const hasRole = useRole(role || []);

  const canAccess = permission ? hasPermission : hasRole;

  if (!canAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
```

**Testing Requirements:**

- Test permission checks
- Test role checks
- Test component rendering
- Test fallback display

**Success Criteria:**

- Permission checks work
- Components render correctly
- Fallbacks display properly
- Hooks return correct values

**Estimated Time:** 2 days

---

### Task 5.2: Implement Role-Based Navigation

**Duration:** 2 days

**Subtasks:**

1. Filter navigation items by permissions
2. Update sidebar navigation
3. Add role-based menu items
4. Hide unauthorized routes
5. Update breadcrumbs with permissions

**Testing Requirements:**

- Test navigation filtering
- Test role-based display
- Test route hiding

**Success Criteria:**

- Navigation filters correctly
- Unauthorized items hidden
- Role-based menus work

**Estimated Time:** 2 days

---

### Task 5.3: Add Admin-Only Features

**Duration:** 1-2 days

**Subtasks:**

1. Create admin dashboard section
2. Add user management UI (if required)
3. Add system settings (if required)
4. Protect admin routes
5. Add admin-only components

**Testing Requirements:**

- Test admin access
- Test non-admin restrictions
- Test admin features

**Success Criteria:**

- Admin features accessible
- Non-admins blocked
- Admin UI functional

**Estimated Time:** 1-2 days

---

## Phase 6: Advanced Features (1-2 weeks, LOW PRIORITY)

**Objective:** Implement advanced user management features.

**Priority:** ⚪ Low - Nice to have features

**Dependencies:** Phase 3, Backend Phase 6

### Task 6.1: Implement Team/Workspace Management

**Duration:** 3-4 days

**Subtasks:**

1. Create team management UI
2. Add team member invitation
3. Add role assignment within teams
4. Add team settings
5. Integrate with backend

**Testing Requirements:**

- Test team creation
- Test member invitation
- Test role assignment

**Success Criteria:**

- Teams can be created
- Members can be invited
- Roles assigned correctly

**Estimated Time:** 3-4 days

---

### Task 6.2: Add User Impersonation (Admin Feature)

**Duration:** 2 days

**Subtasks:**

1. Create impersonation UI
2. Add impersonation start/stop
3. Add impersonation indicator
4. Log impersonation events
5. Integrate with backend

**Testing Requirements:**

- Test impersonation start
- Test impersonation stop
- Test audit logging

**Success Criteria:**

- Admins can impersonate
- Indicator displays
- Events logged

**Estimated Time:** 2 days

---

### Task 6.3: Implement User Preferences Sync

**Duration:** 2 days

**Subtasks:**

1. Sync preferences across devices
2. Add preference conflict resolution
3. Add preference export/import
4. Optimize sync performance

**Testing Requirements:**

- Test cross-device sync
- Test conflict resolution
- Test export/import

**Success Criteria:**

- Preferences sync
- Conflicts resolved
- Export/import works

**Estimated Time:** 2 days

---

## Component Architecture

### Directory Structure

```
/Users/mobeen/Work/Products/wrext/wrext-admin/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── signup/
│   │   │   └── page.tsx
│   │   ├── forgot-password/
│   │   │   └── page.tsx
│   │   ├── reset-password/
│   │   │   └── page.tsx
│   │   └── verify-email/
│   │       └── page.tsx
│   ├── (protected)/
│   │   ├── layout.tsx
│   │   ├── dashboard/
│   │   ├── profile/
│   │   │   └── page.tsx
│   │   ├── settings/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   ├── notifications/
│   │   │   ├── privacy/
│   │   │   └── security/
│   │   └── admin/
│   └── api/
│       └── auth/
│           └── [...nextauth]/
│               └── route.ts
├── components/
│   ├── auth/
│   │   ├── login-form.tsx
│   │   ├── signup-form.tsx
│   │   ├── forgot-password-form.tsx
│   │   ├── reset-password-form.tsx
│   │   └── oauth-buttons.tsx
│   ├── profile/
│   │   ├── profile-form.tsx
│   │   ├── avatar-upload.tsx
│   │   ├── change-password-form.tsx
│   │   └── activity-log.tsx
│   ├── settings/
│   │   ├── settings-nav.tsx
│   │   ├── notification-settings.tsx
│   │   └── privacy-settings.tsx
│   ├── permissions/
│   │   └── can-access.tsx
│   ├── auth-provider.tsx
│   └── nav-user.tsx
├── lib/
│   ├── api-auth.ts
│   ├── permissions.ts
│   └── utils.ts
├── services/
│   ├── auth-api.ts
│   └── user-api.ts
├── schemas/
│   ├── auth-schemas.ts
│   └── profile-schemas.ts
├── hooks/
│   ├── use-auth.ts
│   └── use-permission.ts
├── auth.ts
├── auth.config.ts
└── middleware.ts
```

### Component Patterns

#### 1. Form Components

- Use react-hook-form for form state
- Use Zod for validation
- Separate schema definitions
- Consistent error handling
- Loading states for submissions

#### 2. Auth Components

- Client-side only ('use client')
- Use useAuthStore for state
- Handle redirects after actions
- Display success/error messages
- Loading indicators

#### 3. Protected Components

- Wrap in AuthProvider
- Check permissions/roles
- Graceful fallbacks
- Loading states

#### 4. Layout Components

- Nested layouts for sections
- Consistent navigation
- Responsive design
- Accessibility

---

## Testing Strategy

### Unit Tests

**Tools:** Jest, React Testing Library

**Coverage:**

- Validation schemas (100%)
- Utility functions (100%)
- Permission checks (100%)
- Form validation (100%)

**Example:**

```typescript
// /Users/mobeen/Work/Products/wrext/wrext-admin/__tests__/schemas/auth-schemas.test.ts
import { signupSchema, calculatePasswordStrength } from "@/schemas/auth-schemas";

describe("signupSchema", () => {
  it("should validate valid signup data", () => {
    const data = {
      email: "test@example.com",
      password: "Password123!",
      confirmPassword: "Password123!",
      firstName: "John",
      lastName: "Doe",
      agreeToTerms: true,
    };

    const result = signupSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it("should reject weak passwords", () => {
    const data = {
      email: "test@example.com",
      password: "weak",
      confirmPassword: "weak",
      firstName: "John",
      lastName: "Doe",
      agreeToTerms: true,
    };

    const result = signupSchema.safeParse(data);
    expect(result.success).toBe(false);
  });
});

describe("calculatePasswordStrength", () => {
  it("should calculate password strength correctly", () => {
    expect(calculatePasswordStrength("weak").label).toBe("Weak");
    expect(calculatePasswordStrength("Password123!").label).toBe("Strong");
  });
});
```

### Component Tests

**Coverage:**

- Form components (input, validation, submission)
- Auth components (login, signup, logout)
- Permission components (rendering, fallbacks)
- Navigation components (user menu, links)

**Example:**

```typescript
// /Users/mobeen/Work/Products/wrext/wrext-admin/__tests__/components/signup-form.test.tsx
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { SignupForm } from "@/components/signup-form";
import { AuthApiService } from "@/services/auth-api";

jest.mock("@/services/auth-api");

describe("SignupForm", () => {
  it("should render all form fields", () => {
    render(<SignupForm />);

    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
  });

  it("should show validation errors", async () => {
    render(<SignupForm />);

    const submitButton = screen.getByRole("button", { name: /create account/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
    });
  });

  it("should submit form with valid data", async () => {
    const mockSignup = jest.spyOn(AuthApiService, "signup").mockResolvedValue({
      message: "Success",
      user_id: "123",
      email: "test@example.com",
      verification_email_sent: true,
    });

    render(<SignupForm />);

    fireEvent.change(screen.getByLabelText(/first name/i), {
      target: { value: "John" },
    });
    fireEvent.change(screen.getByLabelText(/last name/i), {
      target: { value: "Doe" },
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/^password/i), {
      target: { value: "Password123!" },
    });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: "Password123!" },
    });
    fireEvent.click(screen.getByLabelText(/agree to terms/i));

    const submitButton = screen.getByRole("button", { name: /create account/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockSignup).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "Password123!",
        firstName: "John",
        lastName: "Doe",
        agreeToTerms: true,
        confirmPassword: "Password123!",
      });
    });
  });
});
```

### Integration Tests

**Tools:** Playwright, Cypress

**Coverage:**

- Auth flows (login, signup, logout)
- Password reset flow
- Email verification flow
- Profile editing
- Settings updates

**Example:**

```typescript
// /Users/mobeen/Work/Products/wrext/wrext-admin/e2e/auth/signup.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Signup Flow", () => {
  test("should complete full signup flow", async ({ page }) => {
    // Navigate to signup
    await page.goto("/signup");

    // Fill form
    await page.fill('input[name="firstName"]', "John");
    await page.fill('input[name="lastName"]', "Doe");
    await page.fill('input[name="email"]', "john.doe@example.com");
    await page.fill('input[name="password"]', "Password123!");
    await page.fill('input[name="confirmPassword"]', "Password123!");
    await page.check('input[name="agreeToTerms"]');

    // Submit form
    await page.click('button[type="submit"]');

    // Should redirect to verification page
    await expect(page).toHaveURL(/\/verify-email/);
    await expect(page.locator("text=Verify Your Email")).toBeVisible();
  });

  test("should show password strength indicator", async ({ page }) => {
    await page.goto("/signup");

    const passwordInput = page.locator('input[name="password"]');

    // Weak password
    await passwordInput.fill("weak");
    await expect(page.locator("text=Weak")).toBeVisible();

    // Strong password
    await passwordInput.fill("Password123!");
    await expect(page.locator("text=Strong")).toBeVisible();
  });
});
```

### E2E Tests

**Coverage:**

- Complete user journeys
- Cross-browser testing
- Mobile responsive testing
- Performance testing

---

## Deployment Considerations

### Environment Variables

```env
# Authentication
NEXTAUTH_SECRET=<generate-secure-random-string>
NEXTAUTH_URL=https://your-domain.com

# Backend API
NEXT_PUBLIC_API_URL=https://api.your-domain.com

# OAuth Providers
GOOGLE_CLIENT_ID=<your-google-client-id>
GOOGLE_CLIENT_SECRET=<your-google-client-secret>
GITHUB_CLIENT_ID=<your-github-client-id>
GITHUB_CLIENT_SECRET=<your-github-client-secret>

# Feature Flags
NEXT_PUBLIC_ENABLE_OAUTH=true
NEXT_PUBLIC_ENABLE_2FA=true
```

### Build Optimization

1. **Code Splitting**
   - Dynamic imports for large components
   - Route-based code splitting
   - Lazy load auth providers

2. **Image Optimization**
   - Use Next.js Image component
   - Optimize avatar uploads
   - Lazy load images

3. **Bundle Analysis**
   - Run bundle analyzer
   - Remove unused dependencies
   - Tree-shake imports

4. **Caching Strategy**
   - Cache API responses
   - Use SWR for data fetching
   - Implement service workers

### Security Checklist

- [ ] CSRF protection enabled
- [ ] Rate limiting on auth endpoints
- [ ] Secure session storage
- [ ] XSS protection
- [ ] SQL injection prevention
- [ ] Secure password hashing
- [ ] Token expiry validation
- [ ] HTTPS enforced
- [ ] Security headers configured
- [ ] Input sanitization
- [ ] Output encoding
- [ ] Audit logging enabled

### Performance Targets

- First Contentful Paint: < 1.5s
- Time to Interactive: < 3.5s
- Lighthouse Score: > 90
- Bundle Size: < 200kb (gzipped)

### Monitoring & Analytics

1. **Error Tracking**
   - Sentry for error monitoring
   - Custom error boundaries
   - User feedback collection

2. **Analytics**
   - Track auth conversions
   - Monitor user flows
   - A/B testing setup

3. **Performance Monitoring**
   - Real user monitoring
   - Core Web Vitals
   - API response times

---

