# Tallem Users Dashboard

Production-ready admin dashboard for students, teachers, and entity managers.

## Stack

- React 19
- Vite
- React Query
- React Hook Form + Yup
- Zustand
- i18next
- Tailwind CSS
- Axios

## Current Codebase

The app now uses JavaScript and JSX only.

- Source files live under `src/`
- Components use `.jsx`
- Utility and config modules use `.js`
- Vite config lives in `vite.config.js`

## Structure

```text
src/
  api/
  config/
  features/
    auth/
    entity-manager/
    teacher/
  globals/
    components/
    hooks/
    icons/
  pages/
  routes/
  stores/
  utils/
```

## Development

```bash
npm install
npm run dev
```

The app runs at `http://localhost:5173/`.

## Build

```bash
npm run build
```

## Notes

- Routing is language-prefixed under `/:lang`
- Authentication is cookie-backed
- Shared UI lives in `src/globals/components`
- Role-based features live under `src/features/entity-manager` and `src/features/teacher`

## Migration Helper

The repo includes `scripts/convert-ts-to-jsx.cjs`, which was used to strip TypeScript syntax and emit the JavaScript/JSX version of the app.
