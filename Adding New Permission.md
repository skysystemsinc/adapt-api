# Adding New Permissions to the Application

This guide explains how to introduce a new permission to the application's Role-Based Access Control (RBAC) system.

## Table of Contents

- [Overview](#overview)
- [Step-by-Step Guide](#step-by-step-guide)
  - [Backend Steps](#backend-steps)
  - [Frontend Steps](#frontend-steps)
- [Examples](#examples)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Overview

The application uses a RBAC (Role-Based Access Control) system where:
- **Permissions** define what actions users can perform (e.g., `create_users`, `view_reports`)
- **Roles** are collections of permissions (e.g., "Admin", "Manager")
- **Users** are assigned roles, which grant them the associated permissions

To introduce a new permission, you need to:
1. Define it in the backend (optional, for type safety)
2. Create it in the database
3. Use it to protect backend endpoints (if needed)
4. Check it in frontend components
5. Assign it to appropriate roles

## Step-by-Step Guide

### Backend Steps

#### Step 1: Add Permission to Constants (Optional but Recommended)

**File:** `adapt-api/src/modules/rbac/constants/permissions.constants.ts`

Add your new permission to the `Permissions` enum for type safety and better IDE support:

```typescript
export enum Permissions {
  // ... existing permissions ...
  
  // Your new permission
  VIEW_DASHBOARD = 'view_dashboard',
  MANAGE_SETTINGS = 'manage_settings',
}
```

**Note:** The enum value (e.g., `'view_dashboard'`) is the actual permission name string that will be stored in the database and used throughout the application.

#### Step 2: Create Permission in Database

You have two options:

##### Option A: Via RBAC Management UI (Recommended)

1. Navigate to `/super-admin/rbac` in your application
2. Go to the **Permissions** section
3. Click **"Create Permission"** or the **+** button
4. Fill in the form:
   - **Name**: `your_new_permission` (must match exactly what you'll use in code)
   - **Description**: Optional description explaining what this permission allows
5. Click **Save**

##### Option B: Via API Endpoint

Make a POST request to create the permission:

```bash
POST /admin/rbac/permissions
Content-Type: application/json
Authorization: Bearer <your-token>

{
  "name": "your_new_permission",
  "description": "Description of what this permission allows"
}
```

**Important:** The permission `name` must match exactly what you'll use in your code (case-sensitive).

#### Step 3: Protect Backend Endpoints (If Needed)

**File:** `adapt-api/src/modules/[module]/controllers/[controller].ts`

Use the `@RequirePermissions` decorator to protect API endpoints:

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { RequirePermissions } from 'src/common/decorators/require-permissions.decorator';
import { Permissions } from '../rbac/constants/permissions.constants';

@Controller('your-endpoint')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class YourController {
  
  @Get()
  @RequirePermissions(Permissions.VIEW_DASHBOARD)
  async getDashboard() {
    // This endpoint now requires 'view_dashboard' permission
    return { data: 'dashboard data' };
  }
  
  @Post()
  @RequirePermissions(Permissions.MANAGE_SETTINGS)
  async updateSettings() {
    // This endpoint requires 'manage_settings' permission
    return { success: true };
  }
}
```

**Notes:**
- `JwtAuthGuard` ensures the user is authenticated
- `PermissionsGuard` checks if the user has the required permissions
- You can specify multiple permissions: `@RequirePermissions(Permissions.PERM1, Permissions.PERM2)`
- The guard checks if the user has **any** of the specified permissions (OR logic)

### Frontend Steps

#### Step 1: Use Permission Hook in Components

**File:** Any component file (e.g., `src/components/your-component.tsx`)

Import and use the `useUserPermissions` hook:

```typescript
import { useUserPermissions } from "@/hooks/use-user-permissions"

export function YourComponent() {
  const { hasPermission, loading, error } = useUserPermissions()
  
  if (loading) {
    return <div>Loading...</div>
  }
  
  if (error) {
    return <div>Error loading permissions</div>
  }
  
  // Check if user has permission
  if (!hasPermission("view_dashboard")) {
    return <div>Access Denied</div>
  }
  
  return (
    <div>
      {/* Your component content */}
    </div>
  )
}
```

#### Step 2: Conditional Rendering Based on Permissions

```typescript
const { hasPermission } = useUserPermissions()

return (
  <div>
    {/* Only show button if user has permission */}
    {hasPermission("manage_settings") && (
      <Button onClick={handleSettings}>
        Manage Settings
      </Button>
    )}
    
    {/* Show different content based on permissions */}
    {hasPermission("view_reports") ? (
      <ReportsView />
    ) : (
      <div>You don't have access to reports</div>
    )}
  </div>
)
```

#### Step 3: Protect Entire Pages/Routes

**File:** `src/app/[path]/page.tsx`

Example implementation (based on `src/app/(unlocalized)/.../super-admin/user/create/page.tsx`):

```typescript
"use client"

import { useUserPermissions } from "@/hooks/use-user-permissions"
import { useRouter } from "next/navigation"
import { useEffect, useRef } from "react"
import { useToast } from "@/hooks/use-toast"

export default function YourProtectedPage() {
  const { hasPermission, loading: permissionsLoading } = useUserPermissions()
  const router = useRouter()
  const { toast } = useToast()
  const hasRedirected = useRef(false)

  // Redirect if user doesn't have permission
  useEffect(() => {
    if (!permissionsLoading && !hasRedirected.current) {
      if (!hasPermission("your_permission_name")) {
        hasRedirected.current = true
        router.push("/super-admin") // Redirect to safe page
        toast({
          title: "Access Denied",
          description: "You don't have permission to access this page",
          variant: "destructive",
        })
      }
    }
  }, [permissionsLoading, hasPermission, router, toast])

  // Show loading state
  if (permissionsLoading) {
    return <div>Loading permissions...</div>
  }

  // Don't render if no permission (redirect will happen)
  if (!hasPermission("your_permission_name")) {
    return null
  }

  return (
    <div>
      {/* Your page content */}
    </div>
  )
}
```

#### Step 4: Filter Menu Items (Optional)

**File:** `src/components/admin/admin-layout-wrapper.tsx`

Update the `filterMenuItemsByPermissions` function to hide menu items based on permissions:

```typescript
const filterMenuItemsByPermissions = (items: MenuItem[], hasPermission: (permission: string) => boolean): MenuItem[] => {
  return items.filter((item) => {
    // Hide menu item if user doesn't have required permission
    if (item.href === "/your-route" && !hasPermission("your_permission_name")) {
      return false
    }
    
    // ... other permission checks ...
    
    return true
  })
}
```

#### Step 5: Assign Permission to Roles

After creating the permission, you need to assign it to roles:

1. Navigate to `/super-admin/rbac` in your application
2. Find the role you want to update (e.g., "Admin", "Manager")
3. Click the **key icon** (🔑) next to the role to open the permissions dialog
4. Check the checkbox next to your new permission
5. Click **"Save Permissions"**

Users with that role will now have the new permission.

## Examples

### Example 1: Adding "View Analytics" Permission

#### Backend:

```typescript
// permissions.constants.ts
export enum Permissions {
  // ... existing ...
  VIEW_ANALYTICS = 'view_analytics',
}

// analytics.controller.ts
@Controller('analytics')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AnalyticsController {
  @Get()
  @RequirePermissions(Permissions.VIEW_ANALYTICS)
  async getAnalytics() {
    return { data: 'analytics data' }
  }
}
```

#### Frontend:

```typescript
// analytics-page.tsx
export function AnalyticsPage() {
  const { hasPermission } = useUserPermissions()
  
  if (!hasPermission("view_analytics")) {
    return <AccessDenied />
  }
  
  return <AnalyticsDashboard />
}
```

### Example 2: Adding "Export Data" Permission

```typescript
// component.tsx
const { hasPermission } = useUserPermissions()

<Button 
  onClick={handleExport}
  disabled={!hasPermission("export_data")}
>
  Export Data
</Button>
```

## Best Practices

1. **Naming Convention**: Use lowercase with underscores (e.g., `view_users`, `create_orders`)
2. **Descriptive Names**: Permission names should clearly indicate what they allow (e.g., `view_reports` not `reports`)
3. **Granular Permissions**: Create specific permissions rather than broad ones (e.g., `create_users` and `update_users` instead of just `manage_users`)
4. **Consistent Checking**: Always check permissions on both frontend (UX) and backend (security)
5. **Error Handling**: Provide clear error messages when users lack permissions
6. **Type Safety**: Use the `Permissions` enum in TypeScript for type safety
7. **Documentation**: Document what each permission allows in the permission description

## Troubleshooting

### Permission Not Working?

1. **Check Permission Name**: Ensure the permission name in your code matches exactly with the database (case-sensitive)
2. **Verify Assignment**: Confirm the permission is assigned to the user's role via RBAC UI
3. **Check Backend Guards**: Ensure `JwtAuthGuard` and `PermissionsGuard` are applied to your endpoints
4. **Frontend Loading**: Make sure permissions have finished loading before checking: `if (loading) return <Loading />`
5. **Session Refresh**: User may need to log out and log back in for new permissions to take effect

### Permission Check Returns False?

- Verify the user's role has the permission assigned
- Check that the permission name string matches exactly
- Ensure the session token is valid and includes the updated permissions
- Check browser console for API errors when fetching permissions

### Backend Returns 403 Forbidden?

- Verify `@RequirePermissions` decorator is applied correctly
- Check that `PermissionsGuard` is included in `@UseGuards`
- Ensure the user has the required permission assigned to their role
- Check backend logs for specific permission check failures

## Related Files

### Backend:
- `adapt-api/src/modules/rbac/constants/permissions.constants.ts` - Permission constants
- `adapt-api/src/modules/rbac/services/permissions.service.ts` - Permission service
- `adapt-api/src/modules/rbac/controllers/permissions.controller.ts` - Permission API endpoints
- `adapt-api/src/common/guards/permissions.guard.ts` - Permission guard
- `adapt-api/src/common/decorators/require-permissions.decorator.ts` - Permission decorator

### Frontend:
- `src/hooks/use-user-permissions.ts` - Permission hook
- `src/services/rbac.service.ts` - RBAC API service
- `src/components/admin/rbac/` - RBAC management components
- `src/components/admin/admin-layout-wrapper.tsx` - Menu filtering

## Additional Resources

- RBAC Management UI: `/super-admin/rbac`
- API Endpoint: `GET /users/me/permissions` - Get current user's permissions
- API Endpoint: `GET /admin/rbac/permissions` - List all permissions (requires `manage_rbac`)

---

**Last Updated:** [Current Date]
**Maintained By:** Development Team