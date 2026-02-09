# Role-Based Structure Documentation

## Overview

The application has been refactored to organize code by user role, making it more scalable and maintainable. This document describes the new structure and how to work with it.

## Structure

### Features Organization

Features are organized by role under `src/features/[role-name]/`:

```
src/features/
├── auth/                    # Shared authentication features
├── entity-manager/          # Entity Manager features
│   ├── halaqas/            # Halaqas management
│   ├── warnings/           # Warnings management
│   └── index.ts            # Barrel exports
└── students/               # Students features (shared)
```

### Pages Organization

Pages are organized by role under `src/pages/[role-name]/`:

```
src/pages/
├── entity-manager/         # Entity Manager pages
│   ├── HalaqasListPage.tsx
│   ├── CreateHalaqaPage.tsx
│   ├── EditHalaqaPage.tsx
│   ├── HalaqaDetailPage.tsx
│   ├── WarningsPage.tsx
│   └── index.ts            # Barrel exports
├── DashboardPage.tsx       # Shared pages
├── LoginPage.tsx
└── [other shared pages]
```

### Routes Organization

Routes are organized by role under `src/routes/[role-name]/`:

```
src/routes/
├── entity-manager/         # Entity Manager routes
│   ├── routes.tsx          # Route definitions
│   └── index.ts            # Barrel exports
├── routes.tsx              # Main routes (imports role-specific routes)
├── AppRoutes.tsx
└── [other route files]
```

## Benefits

1. **Clear Separation**: Each role's code is isolated
2. **Scalability**: Easy to add new roles (teacher, admin, etc.)
3. **Maintainability**: Easy to find and update role-specific code
4. **Modularity**: Each role module is self-contained

## Adding New Roles

When adding a new role (e.g., `teacher`), follow this pattern:

### 1. Create Feature Directory

```
src/features/teacher/
├── study-plan/
│   ├── components/
│   ├── hooks/
│   ├── services/
│   └── ...
├── absences/
└── index.ts
```

### 2. Create Pages Directory

```
src/pages/teacher/
├── StudyPlanPage.tsx
├── AbsencesPage.tsx
└── index.ts
```

### 3. Create Routes Directory

```
src/routes/teacher/
├── routes.tsx
└── index.ts
```

### 4. Export Routes

In `src/routes/teacher/routes.tsx`:

```typescript
import { RouteConfig } from '@/globals/types';
import { ROUTE_PATHS } from '@/config';
import { StudyPlanPage, AbsencesPage } from '@/pages/teacher';

export const teacherRoutes: RouteConfig[] = [
    {
        path: ROUTE_PATHS.STUDY_PLAN,
        element: <StudyPlanPage />,
        roles: ['teacher']
    },
    {
        path: ROUTE_PATHS.ABSENCES,
        element: <AbsencesPage />,
        roles: ['teacher']
    }
];
```

### 5. Import in Main Routes

In `src/routes/routes.tsx`:

```typescript
import { teacherRoutes } from './teacher';

export const routes: RouteConfig[] = [
    // ... shared routes
    ...entityManagerRoutes,
    ...teacherRoutes,  // Add teacher routes
];
```

## Current Implementation

### Entity Manager Module

**Features:**
- `src/features/entity-manager/halaqas/` - Halaqas management
- `src/features/entity-manager/warnings/` - Warnings management

**Pages:**
- `src/pages/entity-manager/HalaqasListPage.tsx`
- `src/pages/entity-manager/CreateHalaqaPage.tsx`
- `src/pages/entity-manager/EditHalaqaPage.tsx`
- `src/pages/entity-manager/HalaqaDetailPage.tsx`
- `src/pages/entity-manager/WarningsPage.tsx`

**Routes:**
- `src/routes/entity-manager/routes.tsx` - Contains all entity manager routes

## Import Examples

### Importing from Entity Manager Features

```typescript
// From entity-manager features
import { useHalaqas } from '@/features/entity-manager/halaqas/hooks/useHalaqas';
import { useWarnings } from '@/features/entity-manager/warnings/hooks/useWarnings';

// Or using barrel exports
import { useHalaqas } from '@/features/entity-manager';
```

### Importing Entity Manager Pages

```typescript
// Individual imports
import HalaqasListPage from '@/pages/entity-manager/HalaqasListPage';

// Or using barrel exports
import { HalaqasListPage, WarningsPage } from '@/pages/entity-manager';
```

### Importing Entity Manager Routes

```typescript
// In main routes.tsx
import { entityManagerRoutes } from '@/routes/entity-manager';

export const routes: RouteConfig[] = [
    // ... other routes
    ...entityManagerRoutes,
];
```

## Best Practices

1. **Keep Role Modules Isolated**: Don't import from one role module into another
2. **Use Barrel Exports**: Create `index.ts` files for cleaner imports
3. **Follow the Pattern**: When adding new roles, follow the same structure
4. **Shared Code**: Put shared code in `features/auth/` or `globals/`
5. **Documentation**: Update this file when adding new roles

## Migration Notes

- All entity manager features, pages, and routes have been moved to their respective role directories
- Imports have been updated throughout the codebase
- The structure is backward compatible with existing code patterns
- Future roles should follow the same organizational pattern


