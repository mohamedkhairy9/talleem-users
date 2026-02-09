# Tallem Users Dashboard

Production-ready admin dashboard for students, teachers, and entity managers.

## Architecture

This project follows a scalable, role-based and feature-based architecture:

- **features/** - Feature modules organized by role (entity-manager, teacher, etc.)
- **pages/** - Page components organized by role
- **routes/** - Route configuration organized by role
- **globals/** - Global components organized by UI type (tables, forms, etc.)
- **globals/icons/** - Individual SVG icon components (accept props for styling)

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed documentation.

For information about the role-based structure, see [ROLE_BASED_STRUCTURE.md](./ROLE_BASED_STRUCTURE.md).

## Tech Stack

- **React 19** - UI framework
- **Vite** - Build tool
- **React Hook Form + Yup** - Form handling and validation
- **Axios** - HTTP client with interceptors
- **React Query** - Server state management
- **Zustand** - Client state management
- **i18next** - Internationalization
- **Tailwind CSS** - Styling
- **js-cookie** - Cookie-based authentication (secure)

## Features

- ✅ Cookie-based authentication (secure, HTTP-only ready)
- ✅ URL parameters for localization and filtering
- ✅ Role-based access control (RBAC)
- ✅ Multi-language support (English/Arabic)
- ✅ Optimized for 70,000+ users
- ✅ Production-ready error handling
- ✅ Code splitting and performance optimization

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Create `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

4. Update `.env` with your API URL:
```
VITE_API_BASE_URL=http://localhost:8000/api
```

5. Start development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173/`

## Production Build

```bash
npm run build
```

The built files will be in the `dist/` directory.

## Project Structure

```
src/
├── api/                      # API layer (axios, services, hooks)
├── features/                 # Feature modules organized by role
│   ├── auth/                # Authentication features
│   ├── entity-manager/       # Entity Manager features
│   │   ├── halaqas/         # Halaqas management
│   │   ├── warnings/        # Warnings management
│   │   └── index.ts         # Barrel exports
│   └── students/            # Students features
├── globals/                  # Global components and icons
├── pages/                    # Page components organized by role
│   ├── entity-manager/       # Entity Manager pages
│   │   ├── HalaqasListPage.tsx
│   │   ├── CreateHalaqaPage.tsx
│   │   ├── EditHalaqaPage.tsx
│   │   ├── HalaqaDetailPage.tsx
│   │   ├── WarningsPage.tsx
│   │   └── index.ts
│   └── [other shared pages]
├── routes/                   # Routing configuration organized by role
│   ├── entity-manager/       # Entity Manager routes
│   │   ├── routes.tsx
│   │   └── index.ts
│   └── routes.tsx            # Main routes (imports role-specific routes)
├── stores/                   # State management (Zustand)
└── utils/                    # Utilities and helpers
```

## Authentication

- Tokens are stored in cookies (secure, HTTP-only ready)
- Automatic token attachment via Axios interceptors
- Role and permission-based route protection

## URL Parameters

- Language: `?lang=en` or `?lang=ar`
- Filters: Automatically synced with URL for shareable links
- Use `useUrlParams` hook for easy parameter management

## Adding New Features

### For Entity Managers:
1. Create feature directory in `src/features/entity-manager/[feature-name]/`
2. Add components, services, hooks, and constants
3. Create page component in `src/pages/entity-manager/`
4. Add route in `src/routes/entity-manager/routes.tsx`

### For Other Roles (Teachers, Admins, etc.):
1. Create role directory: `src/features/[role-name]/[feature-name]/`
2. Create pages: `src/pages/[role-name]/[PageName].tsx`
3. Create routes: `src/routes/[role-name]/routes.tsx`
4. Import routes in `src/routes/routes.tsx`

## Adding New Icons

1. Create icon component in `src/globals/icons/[IconName].jsx`
2. Use `IconBase` component
3. Export from `src/globals/icons/index.js`

## License

Private project
