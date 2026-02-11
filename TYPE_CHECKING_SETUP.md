# Type Checking and Linting Setup

This document describes the type checking and linting setup for the project.

## Overview

The project now includes:
- **TypeScript type checking** that runs before builds
- **ESLint with TypeScript support** for code quality
- **Husky git hooks** for pre-commit and pre-push validation

## Scripts

### `npm run type-check`
Runs TypeScript compiler in check mode without emitting files. This will fail if there are any type errors.

### `npm run build`
Runs type checking first, then builds the project. **Build will fail if type errors are found.**

### `npm run lint`
Runs ESLint on all files (including TypeScript files).

### `npm run lint:fix`
Runs ESLint and automatically fixes fixable issues.

## Git Hooks (Husky)

### Pre-commit Hook
Before each commit, the following checks run:
- TypeScript type checking (`npm run type-check`)
- ESLint linting (`npm run lint`)

**Commits will be blocked if:**
- Type errors are found
- ESLint errors are found (warnings are allowed)

### Pre-push Hook
Before pushing to remote, the following runs:
- Full build process (`npm run build`)

**Push will be blocked if:**
- Type errors are found
- Build fails for any reason

## Configuration Files

### `tsconfig.json`
TypeScript configuration with strict mode enabled. Key settings:
- `strict: true` - Enables all strict type checking options
- `noUnusedLocals: true` - Error on unused local variables
- `noUnusedParameters: true` - Error on unused parameters

### `eslint.config.js`
ESLint configuration with TypeScript support:
- Uses `@typescript-eslint/eslint-plugin` for TypeScript rules
- Checks both `.js` and `.ts/.tsx` files
- Warns on `any` types
- Warns on unused variables

## Fixing Issues

### Type Errors
1. Run `npm run type-check` to see all type errors
2. Fix the errors in the reported files
3. Run `npm run type-check` again to verify

### Linting Errors
1. Run `npm run lint` to see all linting issues
2. Run `npm run lint:fix` to auto-fix some issues
3. Manually fix remaining issues
4. Run `npm run lint` again to verify

## Bypassing Hooks (Not Recommended)

If you need to bypass hooks in an emergency:
```bash
git commit --no-verify
git push --no-verify
```

**Warning:** Only use this in emergencies. It defeats the purpose of type safety.

## Current Status

The setup is complete and working. There are some existing type errors and linting warnings that should be fixed gradually. The build will fail until these are resolved.

