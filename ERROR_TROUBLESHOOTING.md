# Error Troubleshooting Guide

## Error: "Uncaught SyntaxError: Unexpected token '<'"

### What This Error Means

This error occurs when JavaScript expects to receive JavaScript code but instead receives HTML (usually starting with `<`). This typically happens when:

1. **A script file is missing (404 error)** - The browser requests a `.js` file but gets an HTML 404 page instead
2. **Incorrect import path** - An import statement points to a file that doesn't exist
3. **Build/development server issues** - The development server isn't running or has crashed
4. **Path alias resolution issues** - The `@/` alias isn't resolving correctly

### How to Debug

1. **Check the Browser Console Network Tab:**
   - Open DevTools (F12) → Network tab
   - Look for failed requests (red status codes)
   - Check which file is returning HTML instead of JavaScript
   - The filename in the error stack trace will tell you which file failed to load

2. **Check for Missing Files:**
   ```bash
   # Verify all imports resolve correctly
   npm run dev
   ```
   Look for any import errors in the terminal output

3. **Common Causes in This Project:**
   - Missing translation files: `/locales/en/translation.json` or `/locales/ar/translation.json`
   - Incorrect `@/` path alias usage
   - Missing module dependencies (run `npm install`)
   - Development server not running on port 5173

4. **Verify File Structure:**
   - Ensure `public/locales/en/translation.json` exists
   - Ensure `public/locales/ar/translation.json` exists
   - Check that all imported files exist

### Solutions

1. **If it's a missing file:**
   ```bash
   # Check if the file exists
   ls public/locales/en/translation.json
   ls public/locales/ar/translation.json
   ```

2. **If it's a path issue:**
   - Verify `vite.config.js` has the correct alias configuration
   - Verify `jsconfig.json` has matching path aliases
   - Restart the development server

3. **Clear cache and reinstall:**
   ```bash
   # Delete node_modules and reinstall
   rm -rf node_modules package-lock.json
   npm install
   npm run dev
   ```

4. **Check import statements:**
   - Ensure all imports use correct paths
   - Verify `@/` aliases are used consistently
   - Check for typos in import paths

---

## Error: "No checkout popup config found" (core.js:297)

### What This Error Means

**This error is NOT from your application code.** It's coming from a browser extension that's injecting scripts into your page.

The error mentions `core.js:297`, which is typically from:
- Shopping/checkout browser extensions (like Honey, Capital One Shopping, etc.)
- Price comparison extensions
- Coupon/discount extensions
- Other third-party browser extensions

### How to Verify

1. **Open DevTools Console**
2. **Look at the error stack trace** - it will show `core.js:297` which is not in your codebase
3. **Check the Sources tab** - you won't find `core.js` in your project files

### Solutions

1. **Disable browser extensions:**
   - Test in an incognito/private window (extensions are usually disabled)
   - If the error disappears, it's confirmed to be from an extension
   - Disable extensions one by one to identify the culprit

2. **Ignore the error:**
   - This error doesn't affect your application functionality
   - It's just noise from a browser extension trying to interact with your page
   - Your application will work fine despite this error

3. **Block the extension:**
   - Use browser extension management to disable problematic extensions
   - Add exceptions for your development domain

### To Test If It's an Extension Issue

1. Open your app in an **incognito/private window**
2. If the error disappears → it's a browser extension
3. If the error persists → it might be something else (unlikely for this specific error)

---

## General Debugging Steps

1. **Clear browser cache:**
   - Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
   - Clear browser cache and cookies

2. **Check development server:**
   ```bash
   # Ensure dev server is running
   npm run dev
   ```
   Should show: `VITE ready in XXX ms` and `Local: http://localhost:5173/`

3. **Check for console errors:**
   - Open DevTools (F12)
   - Check Console tab for red errors
   - Check Network tab for failed requests

4. **Verify environment:**
   - Ensure Node.js version is 18+
   - Ensure all dependencies are installed (`npm install`)
   - Check that port 5173 is not in use

5. **Check file structure:**
   - Verify all required files exist
   - Check for case-sensitive file paths (important on Linux/Mac)

---

## Quick Fix Checklist

- [ ] Development server is running (`npm run dev`)
- [ ] All dependencies installed (`npm install`)
- [ ] Translation files exist (`public/locales/en/translation.json`, `public/locales/ar/translation.json`)
- [ ] Browser cache cleared (hard refresh)
- [ ] Tested in incognito mode (to rule out extensions)
- [ ] Checked Network tab for failed requests
- [ ] Verified no port conflicts (port 5173 available)

---

## Still Having Issues?

If you're still experiencing the "Unexpected token '<'" error:

1. **Share the exact error message** from the browser console
2. **Share which file is failing** (check Network tab)
3. **Share your browser console output** (screenshot or copy/paste)
4. **Check if it happens in multiple browsers** (Chrome, Firefox, Edge)

This will help identify the specific file causing the issue.
