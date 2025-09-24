# User Management Database Schema - Final List

## 1. users
| Column | Type | Example Value |
|--------|------|---------------|
| id | UUID | `550e8400-e29b-41d4-a716-446655440000` |
| email | VARCHAR(255) | `sarah.johnson@company.com` |
| username | VARCHAR(100) | `sarah.johnson` |
| password_hash | VARCHAR(255) | `$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8` |
| first_name | VARCHAR(100) | `Sarah` |
| last_name | VARCHAR(100) | `Johnson` |
| display_name | VARCHAR(200) | `Sarah Johnson` |
| avatar_url | TEXT | `https://cdn.wrext.com/avatars/550e8400.jpg` |
| status | VARCHAR(20) | `active` |
| email_verified | BOOLEAN | `true` |
| email_verified_at | TIMESTAMPTZ | `2024-01-15T10:30:00Z` |
| last_login_at | TIMESTAMPTZ | `2024-01-22T16:45:00Z` |
| login_count | INTEGER | `247` |
| failed_login_attempts | INTEGER | `3` |
| locked_until | TIMESTAMPTZ | `2024-01-23T10:00:00Z` |
| password_changed_at | TIMESTAMPTZ | `2024-01-10T09:15:00Z` |
| reset_token | VARCHAR(255) | `abc123def456ghi789` |
| reset_token_expires | TIMESTAMPTZ | `2024-01-23T12:00:00Z` |
| language | VARCHAR(10) | `en` |
| timezone | VARCHAR(50) | `America/New_York` |
| primary_workspace_id | UUID | `789e1234-e89b-12d3-a456-426614174001` |
| created_at | TIMESTAMPTZ | `2024-01-10T08:00:00Z` |
| updated_at | TIMESTAMPTZ | `2024-01-22T16:45:00Z` |
| deleted_at | TIMESTAMPTZ | `NULL` |

## 2. roles
| Column | Type | Example Value |
|--------|------|---------------|
| id | UUID | `550e8400-e29b-41d4-a716-446655440000` |
| name | VARCHAR(100) | `admin` |
| display_name | VARCHAR(150) | `Administrator` |
| description | TEXT | `Full system access with user management capabilities` |
| hierarchy_level | INTEGER | `100` |
| is_system_role | BOOLEAN | `true` |
| created_at | TIMESTAMPTZ | `2024-01-10T08:00:00Z` |
| updated_at | TIMESTAMPTZ | `2024-01-22T16:45:00Z` |

## 3. permissions
| Column | Type | Example Value |
|--------|------|---------------|
| id | UUID | `550e8400-e29b-41d4-a716-446655440000` |
| name | VARCHAR(150) | `content.create` |
| display_name | VARCHAR(200) | `Create Content` |
| description | TEXT | `Allows creating new content through the wizard` |
| resource | VARCHAR(50) | `content` |
| action | VARCHAR(50) | `create` |
| created_at | TIMESTAMPTZ | `2024-01-10T08:00:00Z` |

## 4. user_roles
| Column | Type | Example Value |
|--------|------|---------------|
| id | UUID | `550e8400-e29b-41d4-a716-446655440000` |
| user_id | UUID | `123e4567-e89b-12d3-a456-426614174000` |
| role_id | UUID | `456e7890-e89b-12d3-a456-426614174001` |
| workspace_id | UUID | `789e1234-e89b-12d3-a456-426614174003` |
| is_primary | BOOLEAN | `true` |
| assigned_at | TIMESTAMPTZ | `2023-11-15T14:30:00Z` |
| assigned_by_user_id | UUID | `789e1234-e89b-12d3-a456-426614174004` |

## 5. user_sessions
| Column | Type | Example Value |
|--------|------|---------------|
| id | UUID | `550e8400-e29b-41d4-a716-446655440000` |
| user_id | UUID | `123e4567-e89b-12d3-a456-426614174000` |
| session_token | VARCHAR(255) | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| refresh_token | VARCHAR(255) | `xyz987uvw654rst321opq098nml765kji432` |
| device_info | JSONB | `{"browser": "Chrome 120", "os": "macOS", "device": "Desktop"}` |
| ip_address | INET | `192.168.1.100` |
| created_at | TIMESTAMPTZ | `2024-01-22T16:30:00Z` |
| last_activity_at | TIMESTAMPTZ | `2024-01-22T16:45:00Z` |
| expires_at | TIMESTAMPTZ | `2024-01-29T16:30:00Z` |

## 6. workspace_members
| Column | Type | Example Value |
|--------|------|---------------|
| id | UUID | `550e8400-e29b-41d4-a716-446655440000` |
| user_id | UUID | `123e4567-e89b-12d3-a456-426614174000` |
| workspace_id | UUID | `789e1234-e89b-12d3-a456-426614174003` |
| status | VARCHAR(20) | `active` |
| is_default | BOOLEAN | `true` |
| joined_at | TIMESTAMPTZ | `2023-11-15T14:30:00Z` |
| invited_by_user_id | UUID | `789e1234-e89b-12d3-a456-426614174004` |
| last_activity_at | TIMESTAMPTZ | `2024-01-22T16:45:00Z` |

## 7. user_invitations
| Column | Type | Example Value |
|--------|------|---------------|
| id | UUID | `550e8400-e29b-41d4-a716-446655440000` |
| email | VARCHAR(255) | `newuser@company.com` |
| workspace_id | UUID | `789e1234-e89b-12d3-a456-426614174003` |
| invited_by_user_id | UUID | `123e4567-e89b-12d3-a456-426614174000` |
| role_id | UUID | `456e7890-e89b-12d3-a456-426614174001` |
| invitation_token | VARCHAR(255) | `inv_abc123def456ghi789jkl012` |
| status | VARCHAR(20) | `pending` |
| expires_at | TIMESTAMPTZ | `2024-02-01T12:00:00Z` |
| created_at | TIMESTAMPTZ | `2024-01-25T10:00:00Z` |

## Summary
- **Total Tables**: 7
- **Total Columns**: 70
- **Core MVP Tables**: users (22 columns) + user_sessions (9 columns) = 31 columns