# Project Structure Guide

This version is organized to make daily development easier without changing app behavior.

## Main folders

```txt
src/
  app/
    pages/        Global app pages such as Dashboard, Teachers, Unauthorized
    routes/       All route definitions and guards
    stores/       Global Zustand stores

  features/
    auth/         Login, registration, auth services/hooks/components
    entity-manager/
      pages/      Entity manager screens
      halaqas/    Halaqa feature components/hooks/services/config/schemas
      warnings/   Warnings feature
      licenses/   Licenses feature
      join-requests/
    teacher/      Teacher screens and teacher-specific modules

  shared/
    api/          Axios instance and query client
    components/   Shared UI, forms, layout, tables, maps
    hooks/        Shared hooks
    icons/        Shared icons
    utils/        Shared utilities, helpers, constants
```

## How to work on Entity Manager

Most entity-manager work is now inside:

```txt
src/features/entity-manager/
```

Pages are inside:

```txt
src/features/entity-manager/pages/
```

Feature logic is split by module:

```txt
halaqas/
warnings/
licenses/
join-requests/
```

Each module keeps its own `components`, `hooks`, `services`, `config`, `schemas`, `types`, and `utils` where applicable.

## What was not changed

- API behavior
- Authentication logic
- React Query logic
- Zustand store logic
- Routes behavior
- UI/business behavior

Only folder locations and import paths were updated.
