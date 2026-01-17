# Architecture Documentation

## Project Structure

```
Tallem-users-dashboards/
├── src/
│   ├── api/                    # API layer
│   │   ├── config.js          # API configuration
│   │   ├── axiosInstance.js   # Axios instance with interceptors
│   │   ├── queryClient.js     # React Query client config
│   │   ├── services/          # API services
│   │   └── hooks/             # API hooks (React Query)
│   │
│   ├── features/              # Feature modules
│   │   └── [feature-name]/
│   │       ├── components/    # Feature-specific components
│   │       ├── hooks/        # Feature-specific hooks
│   │       ├── services/     # Feature-specific services
│   │       └── constants/    # Feature-specific constants
│   │
│   ├── globals/               # Global/shared code
│   │   ├── components/        # Global components
│   │   │   ├── ui/           # Base UI components (Button, Input, Select)
│   │   │   ├── forms/        # Form components (FormInput, FormSelect)
│   │   │   ├── tables/       # Table components (Table, Pagination)
│   │   │   └── layout/       # Layout components (Layout, Navbar, Sidebar)
│   │   └── icons/            # SVG icon components
│   │
│   ├── pages/                # Page components
│   │   └── [PageName].jsx    # Each page renders the main feature component
│   │
│   ├── routes/               # Routing configuration
│   │   ├── AppRoutes.jsx     # Main routes component
│   │   ├── ProtectedRoute.jsx # Auth-protected route wrapper
│   │   └── routes.js         # Routes configuration
│   │
│   ├── stores/               # State management (Zustand)
│   │   ├── auth.store.js     # Authentication store
│   │   └── language.store.js # Language store
│   │
│   ├── utils/                # Utility functions
│   │   ├── cookies.js        # Cookie management
│   │   ├── urlParams.js      # URL parameter utilities
│   │   ├── hooks/           # Custom hooks
│   │   ├── constants/       # Global constants
│   │   └── helpers/         # Helper functions
│   │
│   ├── App.jsx              # Main app component
│   ├── main.jsx             # App entry point
│   ├── i18n.js              # i18n configuration
│   └── index.css            # Global styles
│
└── public/
    └── locales/             # Translation files
        ├── en/
        └── ar/
```

## Key Principles

### 1. Feature-Based Organization
- Each feature is self-contained with its own components, services, hooks, and constants
- Features are isolated and can be easily maintained or removed

### 2. Page Components
- Pages are thin wrappers that render the main feature component
- Pages handle routing-level logic and data fetching coordination

### 3. Global Components
- Organized by UI type (ui, forms, tables, layout)
- Reusable across all features
- Located in `globals/components/`

### 4. Icons System
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
