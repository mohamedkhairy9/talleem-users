# Architecture Enhancements

## Overview

This document outlines the architectural refactoring and enhancements made to improve code organization, maintainability, and developer experience.

## Key Improvements

### 1. Configuration Management

**New Structure:**
- `src/config/routes.config.ts` - Centralized route paths and labels
- `src/config/menu.config.ts` - Centralized menu configuration
- `src/config/index.ts` - Barrel export for configurations

**Benefits:**
- Single source of truth for routes and menu items
- Easy to update routes across the application
- Type-safe route constants
- Reduced duplication

**Usage:**
```typescript
import { ROUTE_PATHS, MENU_ITEMS } from '@/config';
```

### 2. Barrel Exports (Index Files)

**Created Index Files:**
- `src/api/index.ts` - API layer exports
- `src/stores/index.ts` - Store exports
- `src/utils/index.ts` - Utility exports
- `src/globals/components/index.ts` - Global components
- `src/globals/components/ui/index.ts` - UI components
- `src/globals/components/forms/index.ts` - Form components
- `src/globals/components/tables/index.ts` - Table components
- `src/globals/components/layout/index.ts` - Layout components

**Benefits:**
- Cleaner imports: `import { Button, FormInput } from '@/globals/components'`
- Better code organization
- Easier refactoring
- Reduced import path complexity

**Before:**
```typescript
import Button from '@/globals/components/ui/Button';
import FormInput from '@/globals/components/forms/FormInput';
import ErrorBoundary from '@/globals/components/ErrorBoundary';
```

**After:**
```typescript
import { Button, FormInput, ErrorBoundary } from '@/globals/components';
```

### 3. Route Configuration Enhancement

**Improvements:**
- Routes use centralized `ROUTE_PATHS` constants
- Route configuration is more maintainable
- Type-safe route paths

**Before:**
```typescript
<Route path="/login" element={<LoginPage />} />
```

**After:**
```typescript
<Route path={ROUTE_PATHS.LOGIN} element={<LoginPage />} />
```

### 4. Menu Configuration

**Centralized Menu:**
- Menu items moved from component to configuration file
- Reusable across components
- Type-safe menu structure

**Before:**
```typescript
// Hardcoded in Sidebar component
const menuItems: MenuItem[] = [
    { path: '/', label: 'Dashboard', roles: [...] }
];
```

**After:**
```typescript
// Centralized in config/menu.config.ts
import { MENU_ITEMS } from '@/config';
```

### 5. Import Path Improvements

**Updated Imports:**
- Stores: `import { useAuthStore } from '@/stores'`
- API: `import { useLoginMutation } from '@/api'`
- Utils: `import { useLocale } from '@/utils'`
- Components: `import { Button, Loader } from '@/globals/components'`

## File Structure

```
src/
├── config/                    # NEW: Configuration files
│   ├── routes.config.ts       # Route paths and labels
│   ├── menu.config.ts        # Menu configuration
│   └── index.ts               # Barrel export
│
├── api/
│   └── index.ts               # NEW: Barrel export
│
├── stores/
│   └── index.ts               # NEW: Barrel export
│
├── utils/
│   └── index.ts               # NEW: Barrel export
│
├── globals/
│   ├── components/
│   │   ├── index.ts           # NEW: Barrel export
│   │   ├── ui/
│   │   │   └── index.ts       # NEW: Barrel export
│   │   ├── forms/
│   │   │   └── index.ts       # NEW: Barrel export
│   │   ├── tables/
│   │   │   └── index.ts       # NEW: Barrel export
│   │   └── layout/
│   │       └── index.ts       # NEW: Barrel export
│   └── types.ts
│
└── routes/
    └── routes.tsx             # Enhanced with config constants
```

## Migration Guide

### Updating Imports

**Stores:**
```typescript
// Old
import { useAuthStore } from '@/stores/auth.store';

// New
import { useAuthStore } from '@/stores';
```

**API:**
```typescript
// Old
import { useLoginMutation } from '@/api/hooks/useAuth';

// New
import { useLoginMutation } from '@/api';
```

**Components:**
```typescript
// Old
import Button from '@/globals/components/ui/Button';
import FormInput from '@/globals/components/forms/FormInput';

// New
import { Button, FormInput } from '@/globals/components';
```

**Routes:**
```typescript
// Old
<Navigate to="/login" replace />

// New
import { ROUTE_PATHS } from '@/config';
<Navigate to={ROUTE_PATHS.LOGIN} replace />
```

## Benefits Summary

1. **Better Maintainability**: Centralized configuration reduces duplication
2. **Type Safety**: Constants ensure type-safe route and menu references
3. **Cleaner Code**: Barrel exports simplify imports
4. **Easier Refactoring**: Changing routes/menus requires updates in one place
5. **Better Developer Experience**: Shorter, cleaner import paths
6. **Scalability**: Easy to add new routes, menu items, or components

### 6. Role-Based Organization

**New Structure:**
- `src/features/entity-manager/` - Entity manager features (halaqas, warnings)
- `src/pages/entity-manager/` - Entity manager pages
- `src/routes/entity-manager/` - Entity manager routes
- Each role module is self-contained and scalable

**Benefits:**
- Clear separation of concerns by role
- Easy to add new roles (teacher, admin, etc.)
- Better code organization and maintainability
- Scalable architecture for future growth

**Structure:**
```
src/
├── features/
│   ├── auth/                  # Shared authentication
│   ├── entity-manager/        # Entity manager features
│   │   ├── halaqas/
│   │   ├── warnings/
│   │   └── index.ts
│   └── [future: teacher/, admin/]
├── pages/
│   ├── entity-manager/        # Entity manager pages
│   │   └── index.ts
│   └── [future: teacher/, admin/]
└── routes/
    ├── entity-manager/        # Entity manager routes
    │   └── routes.tsx
    └── routes.tsx             # Imports role-specific routes
```

**Usage:**
```typescript
// Import entity manager routes
import { entityManagerRoutes } from '@/routes/entity-manager';

// In main routes.tsx
export const routes: RouteConfig[] = [
    // ... shared routes
    ...entityManagerRoutes,
    // ... future: ...teacherRoutes, ...adminRoutes
];
```

## Next Steps (Optional Future Enhancements)

1. Add environment-based configuration
2. Implement route guards/permissions system
3. Add route metadata (title, breadcrumbs, etc.)
4. Add configuration validation
5. Implement dynamic menu generation from routes
6. Add teacher and admin role modules following the same pattern
