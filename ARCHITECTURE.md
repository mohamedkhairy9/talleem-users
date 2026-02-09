# Architecture Documentation

## Project Structure

```
Tallem-users-dashboards/
├── src/
│   ├── api/                    # API layer
│   │   ├── config.ts          # API configuration
│   │   ├── axiosInstance.ts   # Axios instance with interceptors
│   │   ├── queryClient.ts     # React Query client config
│   │   └── index.ts           # Barrel exports
│   │
│   ├── features/              # Feature modules organized by role
│   │   ├── auth/              # Authentication features
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── services/
│   │   │   └── utils/
│   │   ├── entity-manager/    # Entity Manager features
│   │   │   ├── halaqas/       # Halaqas management
│   │   │   │   ├── components/
│   │   │   │   ├── hooks/
│   │   │   │   ├── services/
│   │   │   │   ├── schemas/
│   │   │   │   ├── types/
│   │   │   │   └── utils/
│   │   │   ├── warnings/      # Warnings management
│   │   │   │   ├── components/
│   │   │   │   ├── hooks/
│   │   │   │   ├── services/
│   │   │   │   ├── schemas/
│   │   │   │   ├── types/
│   │   │   │   └── utils/
│   │   │   └── index.ts       # Barrel exports
│   │   └── students/          # Students features
│   │
│   ├── globals/               # Global/shared code
│   │   ├── components/        # Global components
│   │   │   ├── ui/           # Base UI components (Button, Input, Select)
│   │   │   ├── forms/        # Form components (FormInput, FormSelect)
│   │   │   ├── tables/       # Table components (Table, Pagination)
│   │   │   └── layout/       # Layout components (Layout, Navbar, Sidebar)
│   │   └── icons/            # SVG icon components
│   │
│   ├── pages/                # Page components organized by role
│   │   ├── entity-manager/   # Entity Manager pages
│   │   │   ├── HalaqasListPage.tsx
│   │   │   ├── CreateHalaqaPage.tsx
│   │   │   ├── EditHalaqaPage.tsx
│   │   │   ├── HalaqaDetailPage.tsx
│   │   │   ├── WarningsPage.tsx
│   │   │   └── index.ts      # Barrel exports
│   │   ├── DashboardPage.tsx
│   │   ├── LoginPage.tsx
│   │   └── [other shared pages]
│   │
│   ├── routes/               # Routing configuration organized by role
│   │   ├── entity-manager/   # Entity Manager routes
│   │   │   ├── routes.tsx    # Route definitions
│   │   │   └── index.ts      # Barrel exports
│   │   ├── AppRoutes.tsx     # Main routes component
│   │   ├── ProtectedRoute.tsx # Auth-protected route wrapper
│   │   ├── RoleBasedIndexRoute.tsx # Role-based index redirect
│   │   └── routes.tsx        # Main routes (imports role-specific routes)
│   │
│   ├── stores/               # State management (Zustand)
│   │   ├── auth.store.ts     # Authentication store
│   │   ├── language.store.ts # Language store
│   │   └── index.ts          # Barrel exports
│   │
│   ├── utils/                # Utility functions
│   │   ├── cookies.ts        # Cookie management
│   │   ├── urlParams.ts      # URL parameter utilities
│   │   ├── hooks/           # Custom hooks
│   │   ├── constants/        # Global constants
│   │   └── helpers/          # Helper functions
│   │
│   ├── config/               # Configuration files
│   │   ├── routes.config.ts  # Route paths and labels
│   │   ├── menu.config.ts   # Menu configuration
│   │   └── index.ts         # Barrel exports
│   │
│   ├── App.tsx              # Main app component
│   ├── main.tsx             # App entry point
│   ├── i18n.ts              # i18n configuration
│   └── index.css            # Global styles
│
└── public/
    └── locales/             # Translation files
        ├── en/
        └── ar/
```

## Key Principles

### 1. Role-Based Organization
- Features, pages, and routes are organized by user role
- Each role has its own module: `entity-manager/`, `teacher/`, `admin/`, etc.
- Makes it easy to add new roles and maintain role-specific code
- Example structure:
  - `src/features/entity-manager/` - Entity manager features
  - `src/pages/entity-manager/` - Entity manager pages
  - `src/routes/entity-manager/` - Entity manager routes

### 2. Feature-Based Organization
- Each feature is self-contained with its own components, services, hooks, and constants
- Features are isolated and can be easily maintained or removed
- Features are nested under role directories

### 3. Page Components
- Pages are thin wrappers that render the main feature component
- Pages handle routing-level logic and data fetching coordination
- Pages are organized by role in `pages/[role-name]/`

### 4. Route Organization
- Routes are organized by role in `routes/[role-name]/`
- Main `routes.tsx` imports and spreads role-specific routes
- Makes it easy to add new role routes without cluttering the main file

### 5. Global Components
- Organized by UI type (ui, forms, tables, layout)
- Reusable across all features and roles
- Located in `globals/components/`

### 6. Icons System
- Each icon is a separate component file
- Icons accept props for styling (width, height, className, etc.)
- Located in `globals/icons/`

## Authentication

- **Cookie-based**: Tokens stored in HTTP-only cookies (via js-cookie)
- **Secure**: Cookies use `secure` flag in production, `sameSite: 'strict'`
- **Axios Integration**: Token automatically attached via interceptors

## URL Parameters

- **Localization**: Language stored in URL (`?lang=en`)
- **Filtering**: Filter state synced with URL for shareable links
- **Utilities**: `useUrlParams` hook for easy parameter management

## Performance Optimization

- **Code Splitting**: Vendor chunks separated (React, Query, Forms)
- **Query Caching**: React Query with optimized cache times
- **Lazy Loading**: Ready for route-based code splitting

## Production Ready

- **Error Boundaries**: Global error handling
- **Loading States**: Consistent loading UI
- **Error Handling**: Standardized error messages
- **Scalability**: Architecture supports 70,000+ users
