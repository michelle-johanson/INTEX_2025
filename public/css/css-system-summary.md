
# Ella Rises CSS System — Codex‑Optimized Summary  
*(For teammates and AI assistants — concise + safe for automated edits)*

This document tells any AI or teammate **exactly how the CSS in this project is structured, what rules must NOT be broken, and which classes/tokens exist.**  
All references reflect the latest uploaded CSS files, including: colors.css, typography.css, forms.css, containers.css, tables.css, buttons.css, foundation.css, utilities.css, and home.css.

---

# 1. FOLDER STRUCTURE (DO NOT CHANGE WITHOUT TEAM DECISION)

```
public/css/
│
├── tokens/
│     ├── colors.css
│     └── typography.css
│
├── core/
│     ├── foundation.css
│     └── utilities.css
│
├── components/
│     ├── buttons.css
│     ├── forms.css
│     ├── containers.css
│     ├── tables.css
│
├── chrome/
│     ├── navbar.css
│     └── footer.css
│
├── pages/
│     ├── home.css
│     ├── events.css
│     ├── dashboard.css
│
└── styles.css
```

**AIs must not rename, remove, or move files unless explicitly instructed.**

---

# 2. TOKENS (GLOBAL VARIABLES)

Tokens live in:

- **colors.css**  fileciteturn8file1
- **foundation.css**  fileciteturn8file6
- **utilities.css**  (spacing + layout helpers)  fileciteturn8file7

## Color Tokens (examples)
```
--blue, --lavender, --cream, --light-pink, --pink,
--sage, --charcoal, --coral, --rose

--text-dark, --text-light, --text-muted
--card-bg, --card-border
--success-bg, --error-bg
```

## Effects + Radius Tokens
```
--radius, --radius-sm, --radius-lg
--shadow, --shadow-sm, --shadow-lg
--transition
```

## Spacing Tokens
```
--space-1 ... --space-8
```

## Typography Tokens  (typography.css)  fileciteturn8file0
```
--font-heading, --font-body, --font-script
--font-size-h1 ... --font-size-h5
--line-height-body, --line-height-heading
--letter-spacing-h1, --letter-spacing-uppercase
```

**RULE:**  
▶️ *All new CSS must use tokens. Never hardcode colors, spacing, or border-radius.*

---

# 3. TYPOGRAPHY RULES (IMPORTANT FOR AIs)

### H1 — Page Titles
- centered, uppercase, bold  
- **decorative underline built into the h1 selector**  
- used only for page-level headings

### H2 — Section or Card Titles
- centered, uppercase  
- no underline

### H3 — Subheadings
- left-aligned, uppercase

### H4
- centered, not uppercase

### H5
- left-aligned, not uppercase

These are defined entirely inside **typography.css**. Do NOT rename or override without purpose.

---

# 4. SECTION LAYOUT SYSTEM (DO NOT BREAK)

Defined in **containers.css**  fileciteturn8file3

All full-width site sections must use:

```
<section class="page-container hero-section">
    <div class="container-inner">
        ...
    </div>
</section>
```

## Structural Classes
```
.page-container      → full-width block, background spans edge-to-edge
.container-inner     → centers inner content, handles left/right padding
```

## Section Variants  
*(Control color + alignment only)*
```
.hero-section
.impact-section
.donate-section
```

**RULES:**  
- No gaps between sections  
- Background color belongs on the *section variant*  
- Padding always goes inside the section  
- Don’t rename `.page-container` or `.container-inner`  

---

# 5. BUTTON SYSTEM (FINAL API)

Defined in **buttons.css**  fileciteturn8file5  
Tokens are component-local (inside buttons.css) and reference global palette tokens.

## Base
```
.btn
.btn-lg
```

## Variants
```
.btn-primary
.btn-secondary
.btn-outline

.btn-red        (solid red → white hover)
.btn-delete     (white → red hover)
.btn-edit       (yellow → yellow-hover)
.btn-table      (compact table button)
```

**RULES FOR AI:**
- Do NOT rename these classes.
- Do NOT invent new variants without explicit instructions.
- All colors must use the button tokens (in buttons.css), not raw hex.

---

# 6. FORMS SYSTEM (STABLE + TOKENIZED)

Defined in **forms.css**  fileciteturn8file2

Key behaviors:
- Custom focus, valid, error states using `--form-*` tokens  
- Custom select arrow (SVG) — **must not be tokenized**  
- Custom checkbox styles  
- Layout helpers:
```
.form-control
.form-row
.checkbox-row
```

**RULES FOR AI:**
- Do NOT rename form elements.
- SVG `data:` URLs MUST REMAIN HEX-CODED (CSS vars do not work in SVG encodings).
- All non-SVG colors must use tokens.

---

# 7. TABLE SYSTEM

Defined in **tables.css**  fileciteturn8file4

Key classes:
```
.table-container
.table-actions
.table-empty
.table-compact
.table-sticky
```

Behaviors:
- zebra striping  
- hover highlight  
- sticky headers  

AIs should *not* modify table markup or class names.

---

# 8. HOMEPAGE-SPECIFIC STYLES

Defined in **home.css**  fileciteturn8file8

Classes:
```
.hero-container, impact-container, donate-container
(hero-section handles background)
```

These styles shape only the homepage; do not mix them with reusable components.

---

# 9. CORE FILES (FOUNDATION + UTILITIES)

## foundation.css  fileciteturn8file6
Provides:
- reset  
- base fonts  
- global background  
- global rounding  
- radius, shadow, transition tokens  

## utilities.css  fileciteturn8file7
Provides:
- spacing utilities  
- flex utilities  
- full-width helpers  

**RULE:**  
Utilities must remain generic. Do not place component styles here.

---

# 10. RULES FOR ANY AI OR TEAMMATE (MOST IMPORTANT PART)

### MUST NOT CHANGE:
- class names  
- folder structure  
- import order in styles.css  
- token names  
- section architecture (`page-container` + `container-inner`)  
- button variant names  
- form element names, checkbox structure, or select SVG arrows  

### MUST ALWAYS:
- use tokens (`var(--token-name)`)  
- keep backgrounds on section variants, not `.container-inner`  
- implement spacing with `--space-*`  
- implement rounding with `--radius`  
- implement shadows with `--shadow`  

### MAY CHANGE (safe):
- padding inside `.container-inner`  
- minor spacing within cards/forms  
- adding new page-section variants (`about-section`, etc.)  

---

# 11. IMPORT ORDER (CRITICAL)

styles.css must import in this exact order:

```
/* TOKENS */
@import "./tokens/colors.css";
@import "./tokens/typography.css";

/* CORE */
@import "./core/foundation.css";
@import "./core/utilities.css";

/* CHROME */
@import "./chrome/navbar.css";
@import "./chrome/footer.css";

/* COMPONENTS */
@import "./components/buttons.css";
@import "./components/forms.css";
@import "./components/containers.css";
@import "./components/tables.css";

/* PAGES */
@import "./pages/home.css";
@import "./pages/events.css";
@import "./pages/dashboard.css";
```

Changing this order may break rounding, table styling, or forms.

---

# END

This file is intentionally concise, AI-friendly, and safe for Codex/Cursor to rely on.
