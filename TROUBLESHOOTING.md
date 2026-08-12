# Troubleshooting Guide - Frontend Features

## 🔍 Features Not Appearing?

If you're not seeing the enhanced features on your pages, follow these steps:

---

## Step 1: Clear Browser Cache

### Chrome/Edge
1. Press `Ctrl + Shift + Delete` (Windows) or `Cmd + Shift + Delete` (Mac)
2. Select "Cached images and files"
3. Click "Clear data"
4. **OR** Hard refresh: `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac)

### Firefox
1. Press `Ctrl + Shift + Delete`
2. Select "Cache"
3. Click "Clear Now"
4. **OR** Hard refresh: `Ctrl + F5`

### Safari
1. Go to Safari → Preferences → Advanced
2. Enable "Show Develop menu"
3. Press `Cmd + Option + E` to empty cache
4. **OR** Hard refresh: `Cmd + Option + R`

---

## Step 2: Verify CSS Files Are Loading

### Open Browser DevTools
1. Press `F12` or `Right-click → Inspect`
2. Go to **Network** tab
3. Refresh the page (`F5`)
4. Look for these CSS files in the list:
   - ✅ `css/index.css` (should be ~20-30 KB)
   - ✅ `css/animations.css` (should be ~5-10 KB)
   - ✅ `css/dashboard.css` (or students.css, etc.)
   - ✅ `css/auth.css`

### Check for 404 Errors
- If any CSS file shows **404** or **red color**, the file path is wrong
- Verify the file exists in `frontend/css/` folder

### Check File Content
1. Click on `css/index.css` in the Network tab
2. Click **Response** or **Preview** tab
3. Verify the content starts with:
   ```css
   /* ============================================================
      css/index.css — Shared styles for all app pages
   ```
4. Search for "Dark mode" or "Enhanced" in the file
5. If you see old content, the cache wasn't cleared properly

---

## Step 3: Test Features Page

1. Open `frontend/test-features.html` in your browser
2. You should see:
   - ✅ Fixed header with blur effect
   - ✅ Different button styles (primary, ghost, outline)
   - ✅ Loading spinners and skeletons
   - ✅ Animations on scroll
   - ✅ Responsive breakpoint detector
   - ✅ Dark mode detector

If test-features.html works but other pages don't:
- The CSS files are fine
- Check if other pages are loading the CSS correctly
- See Step 4

---

## Step 4: Verify HTML Links

### Check Each Page's `<head>` Section

All app pages should have these links **in this order**:
```html
<link rel="stylesheet" href="css/index.css"/>
<link rel="stylesheet" href="css/dashboard.css"/>  <!-- or students.css, etc. -->
<link rel="stylesheet" href="css/animations.css"/>
<link rel="stylesheet" href="css/auth.css"/>
```

### Files That Should Have These Links:
- ✅ `frontend/dashboard.html`
- ✅ `frontend/students.html`
- ✅ `frontend/departments.html`
- ✅ `frontend/courses.html`
- ✅ `frontend/reports.html`

### Common Issues:
❌ Wrong path: `href="../css/index.css"` (has extra `../`)
❌ Missing file: `href="css/style.css"` (old filename)
❌ Wrong order: `auth.css` loaded before `index.css`

---

## Step 5: Check Browser Console for Errors

1. Open DevTools (`F12`)
2. Go to **Console** tab
3. Refresh the page
4. Look for errors (red text)

### Common Errors & Fixes:

#### "Failed to load resource: 404"
```
css/index.css Failed to load resource: the server responded with a status of 404
```
**Fix:** File path is wrong or file doesn't exist
- Check file exists at: `frontend/css/index.css`
- Make sure path in HTML is `href="css/index.css"` (no leading `/`)

#### "Refused to apply style because MIME type"
```
Refused to apply style from 'css/index.css' because its MIME type ('text/html') is not a supported stylesheet MIME type
```
**Fix:** Server is serving HTML instead of CSS
- Your local server might be misconfigured
- Try opening the file directly: `file:///path/to/frontend/dashboard.html`

---

## Step 6: Verify File Contents

### Check if CSS files were properly saved:

Run in terminal (in the project root):
```bash
# Windows PowerShell
Get-Content frontend/css/index.css | Select-String "Dark mode"

# Expected output:
/* Dark mode support (respects system preference) */
```

If you get "no match" or the command fails:
- The file wasn't saved correctly
- Re-download or recreate the CSS files

---

## Step 7: Test Individual Features

### Test Dark Mode
1. Change your system settings to Dark Mode:
   - **Windows 11**: Settings → Personalization → Colors → Dark
   - **macOS**: System Preferences → Appearance → Dark
   - **Linux**: Depends on desktop environment
2. Refresh the page
3. Background should turn dark, text should turn light

If it doesn't work:
- Check if CSS has the media query:
  ```css
  @media (prefers-color-scheme: dark) {
    :root { --bg: #0f172a; }
  }
  ```

### Test Responsive Design
1. Press `F12` to open DevTools
2. Click the **Device Toolbar** icon (📱) or press `Ctrl + Shift + M`
3. Select different devices (iPhone, iPad, etc.)
4. Verify layout changes:
   - Mobile: Single column, hamburger menu
   - Tablet: 2 columns
   - Desktop: Full layout

### Test Animations
1. Open any page
2. Scroll down slowly
3. Look for:
   - Cards fading in from bottom
   - Smooth transitions on hover
   - Loading spinners rotating

If animations don't work:
- Check if `css/animations.css` is loaded
- Check browser console for errors
- Verify CSS custom properties are supported (Chrome 49+, Firefox 31+)

---

## Step 8: Server Issues

### If using a local server (Node.js, Python, etc.):

Make sure CSS files are being served with correct MIME type:

#### Express.js (Node.js)
```javascript
app.use(express.static('frontend'));
```

#### Python HTTP Server
```bash
cd frontend
python -m http.server 8000
```

#### PHP Built-in Server
```bash
cd frontend
php -S localhost:8000
```

### If opening files directly (`file://`):

Some features might not work due to CORS restrictions:
- ❌ Fetch/AJAX requests
- ❌ Some font loading
- ✅ CSS should work fine
- ✅ Basic animations should work

---

## Step 9: Browser Compatibility

### Minimum Browser Versions:
- Chrome/Edge: 90+ ✅
- Firefox: 88+ ✅
- Safari: 14+ ✅
- iOS Safari: 14+ ✅
- Chrome Android: 90+ ✅

### Check Your Browser Version:
- **Chrome/Edge**: Go to `chrome://settings/help`
- **Firefox**: Go to `about:support`
- **Safari**: Safari → About Safari

If your browser is too old:
- Update to the latest version
- Or use a modern browser

---

## Step 10: Still Not Working?

### Create a Minimal Test:

Create `test-simple.html` in the `frontend` folder:
```html
<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="css/index.css"/>
</head>
<body>
  <header class="site-header scrolled">
    <div class="container header-inner">
      <div class="logo">
        <div class="logo-icon">✓</div>
        <span class="logo-text">Test</span>
      </div>
    </div>
  </header>
  <div style="padding-top: 100px; padding: 100px 20px 20px;">
    <button class="btn btn-primary">Primary Button</button>
    <button class="btn btn-ghost">Ghost Button</button>
    <div class="spinner" style="margin-top: 20px;"></div>
  </div>
</body>
</html>
```

Open this file and check:
1. ✅ Header has white background with shadow
2. ✅ Buttons have proper styling
3. ✅ Spinner is rotating

If this works: Your CSS is fine, check the actual pages
If this doesn't work: CSS files have issues, check file paths

---

## Quick Checklist ✓

Use this to verify everything is set up correctly:

- [ ] All CSS files exist in `frontend/css/` folder
- [ ] Browser cache cleared (hard refresh: Ctrl+Shift+R)
- [ ] HTML pages load CSS in correct order
- [ ] No 404 errors in Network tab
- [ ] No errors in Console tab
- [ ] `test-features.html` works correctly
- [ ] Files are served by a local server (not `file://`)
- [ ] Browser is up to date (version check)

---

## Still Having Issues?

### Collect Debug Information:

1. **Browser & Version:**
   - Example: Chrome 119.0.6045.159

2. **Operating System:**
   - Example: Windows 11

3. **Error Messages:**
   - Copy any red errors from Console tab

4. **Network Tab Screenshot:**
   - Show the CSS files being loaded

5. **File Structure:**
   ```
   frontend/
   ├── css/
   │   ├── index.css (✓ exists)
   │   ├── animations.css (✓ exists)
   │   └── ...
   └── dashboard.html (✓ loads css/index.css)
   ```

6. **Test Results:**
   - Does `test-features.html` work? Yes/No
   - Does `test-simple.html` work? Yes/No
   - Can you see spinners rotating? Yes/No

---

## Common Solutions Summary

| Problem | Solution |
|---------|----------|
| Old styles showing | Hard refresh (Ctrl+Shift+R) |
| CSS not loading | Check file paths, verify files exist |
| 404 errors | Fix paths in HTML `<link>` tags |
| No dark mode | Check system settings, verify CSS |
| No animations | Load `animations.css`, check browser |
| Buttons look plain | Clear cache, check `index.css` loaded |
| Responsive broken | Check viewport meta tag, CSS media queries |

---

## Success Indicators

When everything is working, you should see:

✅ **Header:** White background with blur, shadow on scroll
✅ **Buttons:** Rounded, colored, smooth hover effects
✅ **Loading:** Rotating spinners, animated skeletons
✅ **Responsive:** Layout changes on mobile
✅ **Dark Mode:** Colors invert based on system preference
✅ **Animations:** Smooth fade-ins and transitions

---

Need more help? Check:
- `FRONTEND_ENHANCEMENTS.md` for feature documentation
- `frontend/test-features.html` for live examples
- Browser DevTools Network & Console tabs for errors
