# Frontend Permission System

**Version**: 1.0
**Last Updated**: 2025-10-13
**Status**: ✅ Complete

---

## Overview

The frontend permission system provides comprehensive role-based access control (RBAC) for the WREXT application. It works in tandem with the backend RBAC system to provide a seamless, secure user experience.

**Key Features:**
- ✅ Permission-based UI rendering
- ✅ Role-based access control
- ✅ Route protection
- ✅ Workspace-scoped permissions
- ✅ Fast, cached permission checks (no API calls)
- ✅ Error handling for permission denials
- ✅ Integration with NextAuth session

---

## Architecture

### Components

```
Frontend RBAC System
├── Permission Store (Zustand)
│   ├── User permissions cache
│   ├── Workspace permissions cache
│   └── Permission check methods
├── Permission Hooks
│   ├── usePermission
│   ├── useAnyPermission
│   ├── useAllPermissions
│   ├── useRole
│   ├── useIsAdmin
│   └── useIsSuperAdmin
├── Guard Components
│   ├── PermissionGuard
│   ├── RoleGuard
│   ├── AdminGuard
│   └── ProtectedRoute
└── Error Handling
    ├── PermissionErrorBoundary
    └── API Interceptor (403 handling)
```

### Data Flow

```
1. User logs in → NextAuth session created
2. Session includes user.role and user.permissions
3. Permission hooks read from NextAuth session
4. Components use hooks to check permissions
5. UI renders based on permission checks (synchronous, < 1ms)
```

---

## Usage Guide

### 1. Permission Hooks

#### Basic Permission Check

```typescript
import { usePermission } from "@/hooks/use-permission";
import { USER_PERMISSIONS } from "@/lib/permissions";

function DeleteButton({ userId }: Props) {
  const canDelete = usePermission(USER_PERMISSIONS.DELETE);

  if (!canDelete) return null;

  return <Button onClick={() => deleteUser(userId)}>Delete</Button>;
}
```

#### Multiple Permissions (ANY)

```typescript
import { useAnyPermission } from "@/hooks/use-permission";
import { CONTENT_PERMISSIONS } from "@/lib/permissions";

function ContentEditor() {
  const canEdit = useAnyPermission([
    CONTENT_PERMISSIONS.UPDATE,
    CONTENT_PERMISSIONS.PUBLISH,
  ]);

  return <Editor disabled={!canEdit} />;
}
```

#### Multiple Permissions (ALL)

```typescript
import { useAllPermissions } from "@/hooks/use-permission";
import { ADMIN_PERMISSIONS } from "@/lib/permissions";

function RoleManagement() {
  const canManageRoles = useAllPermissions([
    ADMIN_PERMISSIONS.ROLE_READ,
    ADMIN_PERMISSIONS.ROLE_UPDATE,
  ]);

  if (!canManageRoles) {
    return <AccessDenied />;
  }

  return <RoleEditor />;
}
```

#### Role Checks

```typescript
import { useIsAdmin, useIsSuperAdmin, useRole } from "@/hooks/use-permission";
import { ROLES } from "@/lib/permissions";

function AdminPanel() {
  const isAdmin = useIsAdmin(); // admin or super_admin
  const isSuperAdmin = useIsSuperAdmin(); // super_admin only
  const isManager = useRole(ROLES.MANAGER); // specific role

  if (!isAdmin) return <Navigate to="/dashboard" />;

  return (
    <>
      <AdminDashboard />
      {isSuperAdmin && <SuperAdminTools />}
    </>
  );
}
```

### 2. Guard Components

#### PermissionGuard

Show/hide content based on permissions:

```typescript
import { PermissionGuard } from "@/components/permission";
import { USER_PERMISSIONS } from "@/lib/permissions";

function UserActions({ user }: Props) {
  return (
    <>
      {/* Single permission */}
      <PermissionGuard permission={USER_PERMISSIONS.DELETE}>
        <DeleteButton userId={user.id} />
      </PermissionGuard>

      {/* Multiple permissions (ANY) */}
      <PermissionGuard
        permission={[USER_PERMISSIONS.UPDATE, USER_PERMISSIONS.MANAGE_ROLES]}
      >
        <EditButton userId={user.id} />
      </PermissionGuard>

      {/* Multiple permissions (ALL required) */}
      <PermissionGuard
        permission={[USER_PERMISSIONS.UPDATE, USER_PERMISSIONS.DELETE]}
        requireAll={true}
      >
        <AdminActions userId={user.id} />
      </PermissionGuard>

      {/* With fallback */}
      <PermissionGuard
        permission={USER_PERMISSIONS.DELETE}
        fallback={<p className="text-muted-foreground">No permission</p>}
      >
        <DeleteButton userId={user.id} />
      </PermissionGuard>
    </>
  );
}
```

#### RoleGuard

Show/hide content based on role:

```typescript
import { RoleGuard } from "@/components/permission";
import { ROLES } from "@/lib/permissions";

function Navigation() {
  return (
    <>
      {/* Single role */}
      <RoleGuard role={ROLES.ADMIN}>
        <AdminLink href="/admin">Admin Panel</AdminLink>
      </RoleGuard>

      {/* Multiple roles (ANY) */}
      <RoleGuard role={[ROLES.ADMIN, ROLES.SUPER_ADMIN]}>
        <SystemSettingsLink />
      </RoleGuard>

      {/* With fallback */}
      <RoleGuard
        role={ROLES.ADMIN}
        fallback={<p>Admin access required</p>}
      >
        <AdminDashboard />
      </RoleGuard>
    </>
  );
}
```

#### AdminGuard

Shorthand for admin-only content:

```typescript
import { AdminGuard } from "@/components/permission";

function Layout() {
  return (
    <>
      {/* Any admin (admin or super_admin) */}
      <AdminGuard>
        <AdminSidebar />
      </AdminGuard>

      {/* Super admin only */}
      <AdminGuard superAdminOnly={true}>
        <UserManagementLink />
      </AdminGuard>

      {/* With fallback */}
      <AdminGuard fallback={<GuestView />}>
        <AdminView />
      </AdminGuard>
    </>
  );
}
```

### 3. Route Protection

#### ProtectedRoute Component

Protect entire pages/routes:

```typescript
import { ProtectedRoute } from "@/components/permission";
import { USER_PERMISSIONS } from "@/lib/permissions";

// In page component
export default function UsersPage() {
  return (
    <ProtectedRoute permission={USER_PERMISSIONS.READ} requireAdmin={true}>
      <UsersTable />
    </ProtectedRoute>
  );
}

// With custom redirect
export default function WorkspaceSettingsPage({ params }: Props) {
  return (
    <ProtectedRoute
      permission="workspace:manage_settings"
      workspaceId={params.workspaceId}
      redirectTo="/dashboard"
    >
      <WorkspaceSettings />
    </ProtectedRoute>
  );
}

// Multiple permissions (ANY)
export default function ContentEditorPage() {
  return (
    <ProtectedRoute
      permission={["content:update", "content:publish"]}
    >
      <ContentEditor />
    </ProtectedRoute>
  );
}

// With loading fallback
export default function AdminPage() {
  return (
    <ProtectedRoute
      requireAdmin={true}
      fallback={<LoadingSpinner />}
    >
      <AdminDashboard />
    </ProtectedRoute>
  );
}
```

### 4. Error Handling

#### Permission Error Boundary

Wrap components to catch permission errors:

```typescript
import { PermissionErrorBoundary } from "@/components/permission";

function App() {
  return (
    <PermissionErrorBoundary>
      <AdminPanel />
    </PermissionErrorBoundary>
  );
}

// With custom fallback
function App() {
  return (
    <PermissionErrorBoundary
      fallback={<CustomPermissionDenied />}
    >
      <SensitiveComponent />
    </PermissionErrorBoundary>
  );
}
```

#### API Error Interceptor

403 errors are automatically caught and handled by the API error middleware:

```typescript
// Configured in lib/api-error-middleware.ts
// Automatically shows user-friendly toast
// Provides recovery actions (Go to Dashboard, Contact Admin)
```

---

## Permission Constants

### Available Permission Sets

```typescript
import {
  USER_PERMISSIONS,
  WORKSPACE_PERMISSIONS,
  CONTENT_PERMISSIONS,
  TOPIC_PERMISSIONS,
  KNOWLEDGE_PERMISSIONS,
  SUBSCRIPTION_PERMISSIONS,
  MEDIA_PERMISSIONS,
  ADMIN_PERMISSIONS,
  ROLES,
} from "@/lib/permissions";

// User Management
USER_PERMISSIONS.READ        // "user:read"
USER_PERMISSIONS.CREATE      // "user:create"
USER_PERMISSIONS.UPDATE      // "user:update"
USER_PERMISSIONS.DELETE      // "user:delete"
USER_PERMISSIONS.MANAGE_ROLES // "user:manage_roles"
USER_PERMISSIONS.IMPERSONATE // "user:impersonate"

// Workspace Management
WORKSPACE_PERMISSIONS.CREATE         // "workspace:create"
WORKSPACE_PERMISSIONS.READ           // "workspace:read"
WORKSPACE_PERMISSIONS.UPDATE         // "workspace:update"
WORKSPACE_PERMISSIONS.DELETE         // "workspace:delete"
WORKSPACE_PERMISSIONS.MANAGE_MEMBERS // "workspace:manage_members"
WORKSPACE_PERMISSIONS.MANAGE_SETTINGS // "workspace:manage_settings"

// Content Management
CONTENT_PERMISSIONS.CREATE          // "content:create"
CONTENT_PERMISSIONS.READ            // "content:read"
CONTENT_PERMISSIONS.UPDATE          // "content:update"
CONTENT_PERMISSIONS.DELETE          // "content:delete"
CONTENT_PERMISSIONS.PUBLISH         // "content:publish"
CONTENT_PERMISSIONS.MANAGE_WORKFLOW // "content:manage_workflow"

// And more... (see lib/permissions.ts for complete list)

// Roles
ROLES.SUPER_ADMIN      // "super_admin"
ROLES.ADMIN            // "admin"
ROLES.MANAGER          // "manager"
ROLES.DEVELOPER        // "developer"
ROLES.VIEWER           // "viewer"
ROLES.USER             // "user"
ROLES.GUEST            // "guest"
```

---

## Best Practices

### 1. Always Use Permission Constants

❌ **Bad** (hardcoded strings):
```typescript
const canDelete = usePermission("user:delete");
```

✅ **Good** (use constants):
```typescript
import { USER_PERMISSIONS } from "@/lib/permissions";
const canDelete = usePermission(USER_PERMISSIONS.DELETE);
```

### 2. Use Guards for Simple Cases

❌ **Bad** (manual checks):
```typescript
function Actions() {
  const canDelete = usePermission(USER_PERMISSIONS.DELETE);

  return (
    <>
      {canDelete && <DeleteButton />}
    </>
  );
}
```

✅ **Good** (use guards):
```typescript
import { PermissionGuard } from "@/components/permission";

function Actions() {
  return (
    <PermissionGuard permission={USER_PERMISSIONS.DELETE}>
      <DeleteButton />
    </PermissionGuard>
  );
}
```

### 3. Protect Routes at Page Level

✅ **Good** (protect entire page):
```typescript
// app/admin/users/page.tsx
export default function UsersPage() {
  return (
    <ProtectedRoute permission={USER_PERMISSIONS.READ} requireAdmin={true}>
      <UsersTable />
    </ProtectedRoute>
  );
}
```

### 4. Combine with Role Checks for Admin Features

✅ **Good** (admin + permission):
```typescript
<ProtectedRoute
  permission={SUBSCRIPTION_PERMISSIONS.ANALYTICS}
  requireAdmin={true}
>
  <SubscriptionAnalytics />
</ProtectedRoute>
```

### 5. Use Error Boundaries for Sensitive Components

✅ **Good**:
```typescript
<PermissionErrorBoundary>
  <AdminDashboard />
</PermissionErrorBoundary>
```

---

## Sidebar Navigation Filtering

The sidebar automatically filters navigation items based on permissions:

```typescript
// components/app-sidebar.tsx
const navigationGroups: NavGroup[] = [
  {
    groupLabel: "Administration",
    anyRole: [ROLES.ADMIN, ROLES.SUPER_ADMIN], // Group visible to admins
    items: [
      {
        title: "User Management",
        url: "/admin/users",
        icon: UserCog,
        permission: USER_PERMISSIONS.READ, // Item requires permission
      },
      {
        title: "Subscriptions",
        url: "/admin/subscriptions",
        icon: CreditCard,
        anyPermission: ["subscription:analytics", "subscription:read"], // ANY permission
      },
    ],
  },
];

// Automatically filtered by useFilteredNavigation hook
const filteredNavigation = useFilteredNavigation(navigationGroups);
```

---

## Performance

### Permission Check Performance

- **Permission checks**: < 1ms (synchronous, from cache)
- **No API calls**: Permissions loaded once on login
- **Minimal re-renders**: Using Zustand selectors

### Optimization Tips

1. **Use selectors for specific checks**:
   ```typescript
   // ✅ Good (specific selector)
   const canDelete = usePermission(USER_PERMISSIONS.DELETE);

   // ❌ Bad (entire user object)
   const user = usePermissionUser();
   const canDelete = user?.permissions.includes(USER_PERMISSIONS.DELETE);
   ```

2. **Memoize complex permission logic**:
   ```typescript
   const canManageUsers = useMemo(
     () => useAllPermissions([
       USER_PERMISSIONS.CREATE,
       USER_PERMISSIONS.UPDATE,
       USER_PERMISSIONS.DELETE,
     ]),
     []
   );
   ```

---

## Security Notes

### Frontend vs Backend Permissions

⚠️ **IMPORTANT**: Frontend permissions are for **UX only**, not security!

- ✅ Frontend: Hide/disable UI elements
- ✅ Backend: Enforce all permissions
- ❌ Never trust frontend permission checks alone

### Backend Must Always Enforce

All API endpoints MUST check permissions on the backend:

```python
# Backend (Python/FastAPI)
@router.delete("/users/{user_id}")
@require_permission("user:delete")  # ← Backend enforcement
async def delete_user(user_id: str):
    ...
```

Frontend guards are just for better UX:

```typescript
// Frontend (TypeScript/React)
<PermissionGuard permission={USER_PERMISSIONS.DELETE}>
  {/* Only hides button, doesn't prevent API call */}
  <DeleteButton />
</PermissionGuard>
```

---

## Troubleshooting

### Permissions not updating after role change

**Solution**: Permissions are cached in NextAuth session. User needs to log out and log back in.

```typescript
// Force session refresh
import { signOut } from "next-auth/react";
await signOut({ callbackUrl: "/login" });
```

### Permission check always returns false

**Possible causes:**
1. User not logged in
2. Permission not in user's permission list
3. Permission constant typo

**Debug:**
```typescript
import { usePermissionUser } from "@/hooks/use-permission";

function Debug() {
  const user = usePermissionUser();
  console.log("User:", user);
  console.log("Permissions:", user?.permissions);
  console.log("Role:", user?.role);
  return null;
}
```

### Guard not hiding content

**Possible causes:**
1. Permission check returning true
2. Fallback being rendered instead

**Debug:**
```typescript
<PermissionGuard
  permission={USER_PERMISSIONS.DELETE}
  fallback={<p>Fallback rendered</p>}
>
  <p>Content rendered</p>
</PermissionGuard>
```

---

## Related Documentation

- **Backend RBAC**: See backend documentation for permission definitions
- **NextAuth Configuration**: `wrext-admin/lib/auth.ts`
- **Permission Store**: `wrext-admin/stores/permission-store.ts`
- **Permission Hooks**: `wrext-admin/hooks/use-permission.ts`

---

**Last Updated**: 2025-10-13
**Author**: WREXT Development Team
**Version**: 1.0
