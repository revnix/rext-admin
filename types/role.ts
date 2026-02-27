/**
 * Role and Permission type definitions
 * Aligned with backend models
 */

export interface UserWithPermissions {
  id: string;
  email: string;
  name: string;
  role?: string;
  permissions?: string[];
}

export interface StrictUserWithPermissions extends UserWithPermissions {
  role: string;
  permissions: string[];
}

export interface Permission {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  resource: string;
  action: string;
  created_at: string;
}

export interface PermissionWithRoles extends Permission {
  roles?: Array<{
    id: string;
    name: string;
    display_name: string;
    hierarchy_level: number;
  }>;
}

export interface Role {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  hierarchy_level: number;
  is_system_role: boolean;
  created_at: string;
  updated_at: string;
}

export interface RoleWithPermissions extends Role {
  permissions?: Array<{
    id: string;
    name: string;
    display_name: string;
    resource: string;
    action: string;
  }>;
}

export interface RolePermission {
  role_id: string;
  permission_id: string;
}

// Request/Response types
export interface CreateRoleRequest {
  name: string;
  display_name: string;
  description?: string;
  hierarchy_level?: number;
  is_system_role?: boolean;
}

export interface UpdateRoleRequest {
  display_name?: string;
  description?: string;
  hierarchy_level?: number;
}

export interface CreatePermissionRequest {
  name: string;
  display_name: string;
  description?: string;
  resource: string;
  action: string;
}

export interface UpdatePermissionRequest {
  display_name?: string;
  description?: string;
  resource?: string;
  action?: string;
}

export interface AssignPermissionsRequest {
  permission_ids: string[];
}

// Grouped permissions for UI display
export interface GroupedPermissions {
  [resource: string]: Permission[];
}
