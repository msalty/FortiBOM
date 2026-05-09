# FabricBOM Plugin Developer Specification

**Version 1.0 — Branch: `claude/add-plugin-system-hq9xV`**

---

## Overview

A FabricBOM plugin is a **single, self-contained HTML file** that can be installed by dragging it onto the Installed Plugins drop zone in the Saved Projects screen. Once installed, it appears as a first-class nav item in the sidebar and runs inside the main content iframe. Plugins share the app's origin and persist their data in the shared `toolbox_shared` IndexedDB so it is included in the app's **Backup All / Restore** flow on the Settings page.

An alternative **external URL manifest** (`.json` file) is also supported for tools hosted on external servers, but these do not work offline.

---

## Plugin File Format

### Self-Contained HTML Plugin (Recommended)

```
tracker.html          ← the plugin IS this file; drag and drop to install
```

The file must be a complete, valid HTML document with:
1. A **metadata block** in `<head>` that the app reads at install time
2. All CSS **inlined** in a `<style>` tag — no external stylesheets
3. All JavaScript **inlined** in a `<script>` tag — no external scripts
4. No references to relative paths (they will not resolve from a Blob URL)

### External URL Manifest (Fallback)

```
my-tool.json          ← small manifest file pointing to a hosted URL
```

---

## Metadata Block

Every self-contained plugin **must** include this block inside `<head>`, before `<style>`:

```html
<script type="application/json" id="fabricbom-plugin-meta">
{
  "fabricbomPlugin": true,
  "name": "My Tool Name",
  "category": "Tools",
  "icon": "gear",
  "version": "1.0",
  "description": "One-line description shown in the plugin list"
}
</script>
```

### Metadata Fields

| Field | Required | Type | Default | Notes |
|---|---|---|---|---|
| `fabricbomPlugin` | Yes | `true` | — | Must be exactly `true`; app rejects file without it |
| `name` | Yes | string | — | Displayed in sidebar nav and plugin list |
| `category` | No | string | `"Tools"` | Sidebar section heading; multiple plugins can share a category |
| `icon` | No | string | `"gear"` | Icon name (see Icon Reference below) |
| `version` | No | string | `""` | Shown as `v1.0` in the plugin list |
| `description` | No | string | `""` | Subtitle in the plugin list |
| `url` | JSON only | string | — | Required in `.json` manifests; omit in HTML plugins |

### External URL Manifest Format (`.json`)

```json
{
  "fabricbomPlugin": true,
  "name": "Web Traffic Generator",
  "category": "Tools",
  "icon": "chart",
  "version": "1.0",
  "description": "Generate synthetic web traffic for testing",
  "url": "https://example.com/my-tool/"
}
```

> **Note:** External URL plugins show an **External URL** badge in the plugin list instead of **Offline**. They require network access and will not function as a PWA.

---

## Icon Reference

Specify one of these names in the `"icon"` metadata field:

| Name | Description |
|---|---|
| `tracker` | Checklist/tracker with checkmark badge |
| `chart` | Bar chart (analytics, reporting) |
| `link` | Chain link (integrations, URLs) |
| `gear` | Settings cog (configuration, utilities) — **default** |
| `bug` | Bug (issue tracking, debugging) |
| `search` | Magnifying glass (search, lookup) |
| `report` | Document with lines (reports, exports) |
| `database` | Cylinder stack (data, storage) |
| `star` | Star (favorites, highlights) |
| `flag` | Flag (flagging, alerts) |

If an unrecognized value is supplied, a generic plugin icon is used.

---

## Required HTML Structure

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My Plugin</title>

  <script type="application/json" id="fabricbom-plugin-meta">
  { ...metadata... }
  </script>

  <style>
    /* Paste full plugin-theme.css content here, then add plugin-specific styles below */
  </style>
</head>
<body>

  <!-- Sticky toolbar (44px) -->
  <div class="plugin-bar">
    ...toolbar content...
  </div>

  <!-- Scrollable content area -->
  <div class="plugin-scroll">
    ...page content...
  </div>

  <!-- Modals go here, at body level -->

  <script>
    'use strict';
    // All JavaScript inline
  </script>
</body>
</html>
```

---

## CSS Design Tokens

Copy the `:root` block into every plugin. These values must match the app exactly.

```css
:root {
  /* Brand */
  --forti-red: #EE3124;
  --forti-dark: #1A1D23;
  --forti-sidebar: #21252D;
  --forti-border: #363C4A;

  /* Sidebar text (reference only — not used in plugin content area) */
  --forti-text-primary: #E8EAF0;
  --forti-text-secondary: #8A93A8;

  /* Content area background */
  --forti-content-bg: #F2F4F7;

  /* Content area tokens */
  --c-white: #fff;
  --c-border: #DDE1E9;
  --c-text: #2A2F3A;      /* primary body text */
  --c-text2: #6B7589;     /* secondary / label text */
  --c-textm: #9BA5BA;     /* muted / placeholder text */
  --c-sh: #F7F9FC;        /* subtle background (card headers, alternating rows) */
  --c-ib: #C8CDD9;        /* input borders */
  --c-th: #EEF1F6;        /* table header background */
}
```

---

## Typography

```css
body {
  font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
  font-size: 13px;
  line-height: 1.5;
  color: var(--c-text);
  background: var(--forti-content-bg);
}
```

- **Monospace** (SKU IDs, case/bug IDs): `'Courier New', monospace`
- **Label text** (form field labels, table headers): 10px, `font-weight: 700`, `text-transform: uppercase`, `letter-spacing: .05–.07em`, color `var(--c-text2)`
- **Body text**: 12–13px, color `var(--c-text)`
- **Secondary text**: color `var(--c-text2)`
- **Muted text**: color `var(--c-textm)`

---

## Layout

### Body — Full-Height Flex Column

```css
html, body { height: 100%; }
body {
  height: 100vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background: var(--forti-content-bg);
}
```

The plugin renders inside the app's iframe (`flex: 1`). Use the full-height flex column so your toolbar stays pinned and only the content area scrolls.

### Plugin Toolbar (`.plugin-bar`)

Matches the app's `#ch` breadcrumb bar height. Stick it to the top.

```css
.plugin-bar {
  height: 44px;
  background: var(--c-white);
  border-bottom: 1px solid var(--c-border);
  display: flex;
  align-items: center;
  padding: 0 16px;
  gap: 8px;
  flex-shrink: 0;
}
```

Use the left side for stats/context and the right side for action buttons. Separate with `<div class="spacer"></div>` (`flex: 1`).

### Scrollable Content Area (`.plugin-scroll`)

```css
.plugin-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.plugin-scroll::-webkit-scrollbar { width: 6px; }
.plugin-scroll::-webkit-scrollbar-thumb { background: var(--c-ib); border-radius: 3px; }
```

Stack `.lc` cards vertically inside this container.

---

## Component Reference

### Cards (`.lc`)

```css
.lc { background: var(--c-white); border: 1px solid var(--c-border); border-radius: 4px; overflow: hidden; }
.lch { background: var(--c-sh); border-bottom: 1px solid var(--c-border); padding: 9px 18px; display: flex; align-items: center; gap: 8px; }
.lch h2 { font-size: 11px; font-weight: 700; color: var(--c-text); letter-spacing: .04em; text-transform: uppercase; }
.lcb { padding: 18px; }
```

```html
<div class="lc">
  <div class="lch">
    <!-- optional 13×13 SVG icon -->
    <h2>Section Title</h2>
    <!-- optional count badge, spacer, action buttons -->
  </div>
  <div class="lcb">
    <!-- card body content -->
  </div>
</div>
```

### Count Badge (`.cnt-badge`)

Displayed inside `.lch` after the title. Goes gray when count is zero.

```css
.cnt-badge { display: inline-flex; align-items: center; justify-content: center; min-width: 20px; height: 18px; background: var(--forti-red); color: #fff; font-size: 10px; font-weight: 700; border-radius: 9px; padding: 0 5px; }
.cnt-badge.zero { background: var(--c-ib); }
```

```html
<span class="cnt-badge zero" id="my-count">0</span>
```

### Buttons (`.btn`)

```css
.btn { display: inline-flex; align-items: center; gap: 6px; padding: 7px 10px; border-radius: 3px; font-size: 12px; font-weight: 500; cursor: pointer; border: 1px solid transparent; font-family: inherit; transition: background .12s; white-space: nowrap; line-height: 1.2; }
.btn-sm { padding: 5px 9px; font-size: 11px; }
.btn svg { width: 13px; height: 13px; flex-shrink: 0; }

/* Variants */
.bp { background: var(--forti-red); color: #fff; border-color: var(--forti-red); }      /* Primary */
.bp:hover { background: #d42a1e; }
.bs { background: var(--c-white); color: var(--c-text); border-color: var(--c-ib); }    /* Secondary */
.bs:hover { background: var(--c-sh); }
.bd { background: #FEF0EE; color: #C0392B; border-color: #F5C6C2; }                     /* Danger */
.bd:hover { background: #F5C6C2; }
```

Use `.btn.bp` for the primary action (right-most in toolbar). Use `.btn.bs` for secondary. Use `.btn.bd` for destructive actions inside modals only.

Toolbar button order: secondary actions left → primary action right.

### Tables (`.bt`)

```css
.bt-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
table.bt { width: 100%; border-collapse: collapse; font-size: 12px; table-layout: auto; }
table.bt thead th { background: var(--c-th); border: 1px solid var(--c-border); padding: 6px 10px; text-align: left; font-weight: 700; font-size: 10px; text-transform: uppercase; letter-spacing: .05em; color: #4A5268; white-space: nowrap; }
table.bt tbody td { border: 1px solid var(--c-border); padding: 7px 10px; vertical-align: middle; font-size: 12px; }
table.bt tbody tr.bt-even td { background: var(--c-sh); }
table.bt tbody tr.data-row:hover td { background: #EEF1F6; }
```

```html
<div class="bt-wrap">
  <table class="bt">
    <thead><tr><th>Column</th>...</tr></thead>
    <tbody id="my-tbody"></tbody>
  </table>
</div>
```

Add `bt-even` class to every odd-index row for alternating shading. Add `data-row` to clickable rows.

### Expandable Rows

Add a detail `<tr class="exp-row">` immediately after each data row, hidden by default. Toggle with `style="display:none"` / `"display:table-row"`.

```css
tr.data-row { cursor: pointer; }
tr.exp-row > td { padding: 0 !important; border-top: none !important; background: #F7FAFF !important; }
.exp-body { padding: 12px 20px; display: flex; flex-direction: column; gap: 8px; }
.exp-notes { font-size: 12px; color: var(--c-text); line-height: 1.6; white-space: pre-wrap; background: #fff; border: 1px solid var(--c-border); border-radius: 3px; padding: 8px 10px; }
.exp-meta { display: flex; gap: 16px; font-size: 11px; color: var(--c-text2); flex-wrap: wrap; align-items: center; }
```

### Form Inputs (`.fi`)

```css
.fi { background: var(--c-white); border: 1px solid var(--c-ib); border-radius: 3px; padding: 6px 9px; font-size: 13px; color: var(--c-text); font-family: inherit; outline: none; transition: border-color .15s; width: 100%; }
.fi:focus { border-color: var(--forti-red); box-shadow: 0 0 0 2px rgba(238,49,36,.1); }
.fi:read-only { background: var(--c-sh); color: var(--c-text2); }
textarea.fi { resize: vertical; min-height: 60px; line-height: 1.5; }
select.fi { cursor: pointer; }

/* Field label */
.fl { font-size: 10px; font-weight: 700; color: var(--c-text2); text-transform: uppercase; letter-spacing: .07em; display: block; }

/* Form grid layouts */
.fg  { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }  /* 2-column */
.fg1 { display: flex; flex-direction: column; gap: 4px; }           /* full-width field */
.fg2 { display: flex; flex-direction: column; gap: 4px; }           /* half-width field */
```

Always pair a `.fl` label above each `.fi` input:

```html
<div class="fg1">
  <label class="fl">Field Name <span style="color:var(--forti-red)">*</span></label>
  <input type="text" class="fi" placeholder="…">
</div>
```

### Chip Input

For multi-value tag fields (entering multiple IDs, etc.):

```css
.chip-wrap { display: flex; flex-wrap: wrap; gap: 4px; padding: 5px 7px; border: 1px solid var(--c-ib); border-radius: 3px; background: var(--c-white); min-height: 34px; align-items: center; cursor: text; transition: border-color .15s; }
.chip-wrap:focus-within { border-color: var(--forti-red); box-shadow: 0 0 0 2px rgba(238,49,36,.1); }
.chip { display: inline-flex; align-items: center; gap: 3px; background: #EEF3FF; border: 1px solid #B8CBF5; border-radius: 2px; padding: 2px 5px; font-size: 11px; font-family: 'Courier New', monospace; font-weight: 700; color: #3557A5; white-space: nowrap; }
.chip button { background: none; border: none; cursor: pointer; color: #3557A5; font-size: 14px; padding: 0 0 0 2px; line-height: 1; opacity: .6; }
.chip-inp { border: none; outline: none; font-size: 12px; color: var(--c-text); font-family: inherit; background: transparent; flex: 1; min-width: 100px; padding: 1px; }
```

Press **Enter** or **,** to commit a chip. Render chips before the input element; manage as an array and re-render on add/remove.

### Link Chips (read-only, in table cells)

```css
a.lchip { display: inline-block; font-family: 'Courier New', monospace; font-size: 10px; font-weight: 700; color: #1A4E82; background: #EEF3FF; border: 1px solid #B8CBF5; border-radius: 2px; padding: 1px 5px; margin: 1px 1px 1px 0; text-decoration: none; white-space: nowrap; }
a.lchip:hover { background: #D6E4FF; text-decoration: underline; }
```

```html
<a href="https://..." target="_blank" rel="noopener" class="lchip">0974190</a>
```

### Status / Info Badges (`.sbadge`)

```css
.sbadge { display: inline-block; font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; border-radius: 2px; padding: 2px 6px; white-space: nowrap; border: 1px solid transparent; }

/* Semantic color variants */
.st-amber { background: #FFF8EE; color: #8A5800; border-color: #F5D9A0; }  /* pending / attention */
.st-blue  { background: #EEF3FF; color: #3557A5; border-color: #B8CBF5; }  /* in-progress / info */
.st-gray  { background: #F0F0F2; color: #6B7280; border-color: #D1D5DB; }  /* waiting / neutral */
.st-green { background: #EEFBF2; color: #1A7A3A; border-color: #A8DDB5; }  /* resolved / success */
.st-red   { background: #FEE0DE; color: #C0392B; border-color: #F5C6C2; }  /* error / critical */
```

### Modals

```css
.modal-bg { display: none; position: fixed; inset: 0; background: rgba(0,0,0,.45); z-index: 1000; align-items: center; justify-content: center; padding: 20px; }
.modal-bg.on { display: flex; }
.modal-box { background: #fff; border-radius: 5px; box-shadow: 0 8px 32px rgba(0,0,0,.25); width: 100%; max-width: 520px; display: flex; flex-direction: column; max-height: 90vh; }
.modal-hdr { padding: 14px 18px; border-bottom: 1px solid var(--c-border); display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
.modal-hdr h3 { font-size: 14px; font-weight: 600; color: var(--c-text); flex: 1; }
.modal-close { background: none; border: none; cursor: pointer; font-size: 22px; color: var(--c-text2); padding: 0 2px; line-height: 1; }
.modal-body { padding: 18px; overflow-y: auto; display: flex; flex-direction: column; gap: 14px; }
.modal-ftr { padding: 12px 18px; border-top: 1px solid var(--c-border); display: flex; gap: 8px; justify-content: flex-end; flex-shrink: 0; background: var(--c-sh); border-radius: 0 0 5px 5px; }
```

- Close on backdrop click: `onclick="if(event.target===this) this.classList.remove('on')"`
- Close on Escape: listen on `document` for `keydown`, remove `.on` from all open modals
- Never nest a modal inside a scrolling container
- Danger confirm modals: max-width 380–400px; use `.btn.bd` for the confirm button

```html
<div class="modal-bg" id="my-modal" onclick="if(event.target===this)this.classList.remove('on')">
  <div class="modal-box">
    <div class="modal-hdr">
      <h3>Modal Title</h3>
      <button class="modal-close" onclick="document.getElementById('my-modal').classList.remove('on')">×</button>
    </div>
    <div class="modal-body">
      <!-- form fields -->
    </div>
    <div class="modal-ftr">
      <button class="btn bs" onclick="document.getElementById('my-modal').classList.remove('on')">Cancel</button>
      <button class="btn bp" onclick="saveMyThing()">Save</button>
    </div>
  </div>
</div>
```

### Company / Entity Tag (`.co-tag`)

For displaying a single categorization tag inline in a table cell:

```css
.co-tag { display: inline-block; font-size: 11px; color: var(--c-text); background: var(--c-sh); border: 1px solid var(--c-border); border-radius: 2px; padding: 1px 6px; }
```

### Inline Row Action Buttons

```css
.act-cell { white-space: nowrap; text-align: right; padding-right: 8px !important; }
.ic-btn { background: none; border: 1px solid var(--c-ib); border-radius: 3px; cursor: pointer; font-size: 13px; color: var(--c-text2); padding: 2px 7px; font-family: inherit; transition: background .1s, color .1s, border-color .1s; margin-left: 3px; line-height: 1.4; }
.ic-btn:hover { background: var(--c-sh); color: var(--c-text); }
/* Semantic hover variants */
.chk-btn:hover { background: #EEFBF2; color: #1A7A3A; border-color: #A8DDB5; }
.del-btn:hover { background: #FEF0EE; color: #C0392B; border-color: #F5C6C2; }
```

Use Unicode for icons within `.ic-btn`: `✓` (check), `✎` (edit), `✕` (delete).

### Empty State Rows

```css
tr.empty-row td { text-align: center; color: var(--c-text2); font-style: italic; padding: 28px 10px !important; background: transparent !important; }
```

```html
<tr class="empty-row"><td colspan="7">No items yet — click <strong>+ Add</strong> to get started.</td></tr>
```

---

## Storage Guidelines

### Plugin Data — Use IndexedDB

**All plugin data must be stored in the app's shared IndexedDB** (`toolbox_shared`, object store `datasets`), keyed with the prefix `plugin_data_<pluginname>`. This is required so that the **Backup All / Restore** flow on the Settings page (`index.html`) captures and restores your plugin's data alongside the rest of the app.

Because plugins are loaded as Blob URLs derived from the app's origin, they share the origin with the host app and can open `toolbox_shared` directly. The `datasets` store is keyed by a string `key` field; the app already exports every record in that store as part of a backup, so anything you put there round-trips automatically.

> **Do not store plugin data in `localStorage`.** The backup routine only collects `localStorage` keys prefixed with `fortibom_`. Anything you put under `fabricbom_*` (or any other `localStorage` key) will be silently lost when the user restores from a backup. `localStorage` is acceptable for transient UI state only (e.g. last-selected tab, scroll position) — never for user-authored data.

### Storage Helper (paste into every plugin)

```js
const STORE_KEY = 'plugin_data_myplugin';   // unique per plugin; must start with `plugin_data_`

function _openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('toolbox_shared', 2);
    // The host app owns schema migrations; do not declare onupgradeneeded here.
    req.onsuccess = e => resolve(e.target.result);
    req.onerror   = e => reject(e.target.error);
  });
}

async function loadData() {
  try {
    const db = await _openDB();
    return await new Promise((res, rej) => {
      const tx  = db.transaction('datasets', 'readonly');
      const req = tx.objectStore('datasets').get(STORE_KEY);
      req.onsuccess = () => {
        const rec = req.result;
        const d = (rec && rec.data) || {};
        d.items = d.items || [];
        res(d);
      };
      req.onerror = e => rej(e.target.error);
    });
  } catch {
    return { items: [] };
  }
}

async function saveData(d) {
  const db = await _openDB();
  return new Promise((res, rej) => {
    const tx = db.transaction('datasets', 'readwrite');
    tx.objectStore('datasets').put({ key: STORE_KEY, data: d, updatedAt: Date.now() });
    tx.oncomplete = res;
    tx.onerror = e => rej(e.target.error);
  });
}
```

Records you write must be plain objects with a top-level `key` matching `STORE_KEY`. Wrapping the actual payload under a `data` field (as above) keeps your shape future-proof if you later add metadata.

### Key Naming Convention

Reserved keys in the shared `datasets` store (do not reuse):

| Key | Owner |
|---|---|
| `pricing` | App — pricelist dataset |
| `plugin_html_<id>` | App — installed plugin HTML blobs |
| `plugin_data_<pluginname>` | **Your plugin's data** — use this prefix |

`localStorage` keys (reference only — do not write app keys from a plugin):

| Key | Owner |
|---|---|
| `fortibom_cart` | App — current BOM |
| `fortibom_saved` | App — saved projects |
| `fortibom_pi` | App — project info fields |
| `fortibom_plugins` | App — plugin registry |
| `fortibom_settings` | App — settings |

---

## Design Language Rules

1. **Never use `position: fixed` for content** — the plugin runs in an iframe; fixed positioning is relative to the iframe viewport (correct for modals), but avoid it for anything else.
2. **Always inline all CSS** — no `<link>` tags; they will fail when loaded as a Blob URL.
3. **Always inline all JS** — no `<script src="">` tags.
4. **No framework dependencies** — vanilla HTML/CSS/JS only. No React, Vue, jQuery, Bootstrap, etc.
5. **Match border-radius** — cards use `4px`, inputs and buttons use `3px`, badges use `2px`.
6. **Match spacing rhythm** — card padding `18px`, section gap `14px`, form field gap `4px` (label to input), form group gap `12–14px`.
7. **Required field markers** — use `<span style="color:var(--forti-red)">*</span>` after the label text.
8. **IDs in tables** — render monospace IDs as clickable links (`<a class="id-link">`) that open in `target="_blank"`.
9. **Freshness coloring** — if you display a "last checked" timestamp, apply `color: #C0392B` for >14 days, `color: #8A5800` for >7 days.
10. **Escape all user-generated content** before inserting into innerHTML.
11. **Keyboard accessibility** — modals must close on Escape; form inputs must be focusable; buttons must be actual `<button>` elements.

---

## Export / Import Pattern

Plugins should support JSON export/import for data portability:

```js
// Export
async function exportData() {
  const d = await loadData();
  const blob = new Blob([JSON.stringify(d, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `fabricbom-myplugin-${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
}

// Import — merge by ID, never silently overwrite without confirmation
function handleImport(event) {
  const file = event.target.files[0]; if (!file) return;
  const r = new FileReader();
  r.onload = async e => {
    try {
      const incoming = JSON.parse(e.target.result);
      // validate shape, then show confirmation modal before merging via saveData()
    } catch { alert('Invalid file format.'); }
  };
  r.readAsText(file);
}
```

> Per-plugin export/import is a convenience for moving data between installs. The app's **Backup All** in Settings already captures every `plugin_data_*` record automatically — you don't need to do anything beyond writing to IDB under the correct key prefix.

Filename convention: `fabricbom-{pluginname}-YYYY-MM-DD.json`

---

## Complete Minimal Plugin Template

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>My Plugin</title>

<script type="application/json" id="fabricbom-plugin-meta">
{
  "fabricbomPlugin": true,
  "name": "My Plugin",
  "category": "Tools",
  "icon": "gear",
  "version": "1.0",
  "description": "What this plugin does"
}
</script>

<style>
/* ── Paste the full contents of plugins/plugin-theme.css here ── */
/* Then add your plugin-specific styles below */

html, body { height: 100%; }
body { height: 100vh; overflow: hidden; display: flex; flex-direction: column; background: var(--forti-content-bg); }
.plugin-bar { height: 44px; background: var(--c-white); border-bottom: 1px solid var(--c-border); display: flex; align-items: center; padding: 0 16px; gap: 8px; flex-shrink: 0; }
.plugin-scroll { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 14px; }
.spacer { flex: 1; }
</style>
</head>
<body>

<div class="plugin-bar">
  <span style="font-size:12px;color:var(--c-text2);">Context info here</span>
  <div class="spacer"></div>
  <button class="btn btn-sm bp" onclick="openAddModal()">+ Add Item</button>
</div>

<div class="plugin-scroll">
  <div class="lc">
    <div class="lch">
      <h2>My Section</h2>
      <span class="cnt-badge zero" id="item-cnt">0</span>
    </div>
    <div class="bt-wrap">
      <table class="bt">
        <thead><tr><th>ID</th><th>Name</th><th></th></tr></thead>
        <tbody id="item-tbody"></tbody>
      </table>
    </div>
  </div>
</div>

<!-- Add modal -->
<div class="modal-bg" id="add-modal" onclick="if(event.target===this)this.classList.remove('on')">
  <div class="modal-box">
    <div class="modal-hdr">
      <h3>Add Item</h3>
      <button class="modal-close" onclick="document.getElementById('add-modal').classList.remove('on')">×</button>
    </div>
    <div class="modal-body">
      <div class="fg1">
        <label class="fl">Name <span style="color:var(--forti-red)">*</span></label>
        <input type="text" class="fi" id="f-name" placeholder="Enter name">
      </div>
    </div>
    <div class="modal-ftr">
      <button class="btn bs" onclick="document.getElementById('add-modal').classList.remove('on')">Cancel</button>
      <button class="btn bp" onclick="saveItem()">Save</button>
    </div>
  </div>
</div>

<script>
'use strict';
const STORE_KEY = 'plugin_data_myplugin';

function _openDB() {
  return new Promise((res, rej) => {
    const req = indexedDB.open('toolbox_shared', 2);
    req.onsuccess = e => res(e.target.result);
    req.onerror   = e => rej(e.target.error);
  });
}
async function loadData() {
  try {
    const db = await _openDB();
    return await new Promise((res, rej) => {
      const tx = db.transaction('datasets','readonly');
      const req = tx.objectStore('datasets').get(STORE_KEY);
      req.onsuccess = () => { const d = (req.result && req.result.data) || {}; d.items = d.items || []; res(d); };
      req.onerror = e => rej(e.target.error);
    });
  } catch { return { items: [] }; }
}
async function saveData(d) {
  const db = await _openDB();
  return new Promise((res, rej) => {
    const tx = db.transaction('datasets','readwrite');
    tx.objectStore('datasets').put({ key: STORE_KEY, data: d, updatedAt: Date.now() });
    tx.oncomplete = res;
    tx.onerror = e => rej(e.target.error);
  });
}
function esc(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

async function render() {
  const d = await loadData();
  const cnt = document.getElementById('item-cnt');
  cnt.textContent = d.items.length;
  cnt.className = 'cnt-badge' + (d.items.length ? '' : ' zero');
  const tbody = document.getElementById('item-tbody');
  tbody.innerHTML = d.items.length
    ? d.items.map((item, i) => `<tr class="data-row${i%2?' bt-even':''}"><td class="mono">${esc(item.id)}</td><td>${esc(item.name)}</td><td class="act-cell"><button class="ic-btn del-btn" onclick="deleteItem('${esc(item.id)}')">✕</button></td></tr>`).join('')
    : `<tr class="empty-row"><td colspan="3">No items yet — click <strong>+ Add Item</strong> to get started.</td></tr>`;
}

function openAddModal() {
  document.getElementById('f-name').value = '';
  document.getElementById('add-modal').classList.add('on');
  setTimeout(() => document.getElementById('f-name').focus(), 60);
}
async function saveItem() {
  const name = document.getElementById('f-name').value.trim();
  if (!name) { alert('Name is required.'); return; }
  const d = await loadData();
  d.items.push({ id: Date.now().toString(36), name });
  await saveData(d); await render();
  document.getElementById('add-modal').classList.remove('on');
}
async function deleteItem(id) {
  const d = await loadData();
  d.items = d.items.filter(x => x.id !== id);
  await saveData(d); await render();
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') document.getElementById('add-modal').classList.remove('on');
});
render();
</script>
</body>
</html>
```

---

## Installation Flow (User Perspective)

1. Open FabricBOM → click **Saved Projects** in the sidebar
2. Scroll to the **Installed Plugins** card at the bottom
3. Drag the `.html` plugin file onto the drop zone, or click **"or click to browse"**
4. The app reads the metadata block, stores the full HTML in IndexedDB, and the plugin nav item appears in the sidebar immediately under its declared `category`
5. Click the nav item to open the plugin in the main content area
6. To remove: click **Remove** next to the plugin in the Installed Plugins list

The sidebar plugin section is empty and invisible until at least one plugin is installed.

---

## Reference: Installed Plugin List Badges

| Badge | Meaning |
|---|---|
| **Offline** (blue) | Self-contained HTML plugin; works without network access |
| **External URL** (amber) | JSON manifest plugin; requires network; may not embed if the target site sends `X-Frame-Options` headers |

---

*This spec reflects the implementation on branch `claude/add-plugin-system-hq9xV`. Copy `plugins/plugin-theme.css` into your plugin's `<style>` block as the foundation, then add your own styles below it. See `plugins/tracker.html` for a full reference implementation.*
