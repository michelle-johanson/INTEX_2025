# 📘 **CSS Class Reference – Ella Rises UI System**

*A full reference for all reusable UI classes across the application.*

---

# 🎨 **1. Base + Global Styles**

## **Global Resets**

Automatically applied — no classes required.

```
*,
*::before,
*::after
html, body
img, video, svg, canvas
button, input, textarea, select
ul, ol
```

---

# ✨ **2. Typography Classes**

| Class           | Description                        |
| --------------- | ---------------------------------- |
| `page-title`    | Large section/page title (h1-like) |
| `page-subtitle` | Medium subtitle text               |
| `text-center`   | Center-align text                  |
| `text-right`    | Right-align text                   |

Fonts come from tokens:

* `--font-heading`
* `--font-body`

---

# 📏 **3. Utility Classes**

| Class                           | Effect                     |
| ------------------------------- | -------------------------- |
| `.mt-1` `.mt-2` `.mt-3` `.mt-4` | Margin-top sizes           |
| `.mb-1` `.mb-2` `.mb-3` `.mb-4` | Margin-bottom sizes        |
| `.w-100`                        | Sets width: 100%           |
| `.d-flex`                       | `display: flex`            |
| `.flex-center`                  | Flexbox centered alignment |

---

# 🧱 **4. Layout Classes**

| Class                | Description                                                  |
| -------------------- | ------------------------------------------------------------ |
| `page-container`     | Main centered container for most pages (`max-width: 1200px`) |
| `section-inner`      | Centered container within a full-width section               |
| `full-width-section` | Utility for a spanning full-width block                      |

These are used in every view that isn’t a homepage banner.

---

# 🔗 **5. Navbar Classes**

All navbar UI exists under an `.er-navbar` namespace.

| Class                 | Purpose                           |
| --------------------- | --------------------------------- |
| `er-navbar`           | Navbar wrapper                    |
| `er-navbar-inner`     | Inner flex container              |
| `er-navbar-left`      | Left group (logo + links)         |
| `er-navbar-logo`      | Logo wrapper                      |
| `er-navbar-menu`      | UL wrapper for nav links          |
| `er-nav-link`         | Main nav link                     |
| `dropdown`            | Wrapper for dropdown items        |
| `dropdown-menu`       | Hidden menu that appears on hover |
| `dropdown-item`       | Single dropdown link              |
| `er-navbar-donate`    | Styled “DONATE” button            |
| `er-navbar-login`     | Login / account link              |
| `er-account-dropdown` | Account area wrapper              |

---

# 🔘 **6. Button Classes**

Defined under `/components/buttons.css`

| Class           | Style                                         |
| --------------- | --------------------------------------------- |
| `btn`           | Base button (flex center, radius, transition) |
| `btn-primary`   | Pink primary CTA                              |
| `btn-secondary` | Outline style                                 |
| `btn-danger`    | Red destructive action                        |
| `btn-small`     | Smaller sizing                                |
| `btn-large`     | Larger sizing                                 |

These are used throughout forms and actions.

---

# 📝 **7. Form Classes**

Defined in `/components/forms.css`

| Class                     | Purpose                                 |
| ------------------------- | --------------------------------------- |
| *None required on inputs* | Inputs auto-style via element selectors |
| `form`                    | Optional wrapper max-width 600px        |
| `btn-submit`              | Form submission button                  |
| `form-error`              | For future error messages               |

Input types (`text`, `email`, etc.) automatically get styled with spacing, focus rings, and border radius.

---

# 📊 **8. Table Classes**

Defined in `/components/tables.css`

| Class                        | Purpose                                 |
| ---------------------------- | --------------------------------------- |
| *Table elements auto-styled* | table, thead th, tbody td               |
| `table-actions`              | Formats action links inside last column |

Hover effects apply automatically.

---

# 🗂 **9. Card + Detail View Classes**

Defined in `/components/cards.css`

| Class          | Purpose                      |
| -------------- | ---------------------------- |
| `card`         | Generic card block           |
| `page-card`    | Centered card for info pages |
| `detail-card`  | Card for detail view pages   |
| `detail-row`   | Row with label + value       |
| `detail-label` | Left column label            |
| `detail-value` | Right column value           |

These styles power *show pages* for participants, events, donations, etc.

---

# 🏠 **10. Homepage Classes**

From `/pages/home.css`

### **Hero Section**

| Class        | Purpose                        |
| ------------ | ------------------------------ |
| `hero-full`  | Full-width pink hero section   |
| `hero-title` | Large centered heading         |
| `hero-text`  | Subtitle text under hero title |

### **Impact Section**

| Class         | Purpose                  |
| ------------- | ------------------------ |
| `impact-full` | Full-width cream section |
| `impact-grid` | 3-column grid layout     |
| `impact-card` | White cards inside grid  |

### **Donate Banner**

| Class         | Purpose                        |
| ------------- | ------------------------------ |
| `donate-full` | Full-width pink banner section |

---

# 📈 **11. Dashboard Classes**

From `/pages/dashboard.css`

| Class               | Purpose                  |
| ------------------- | ------------------------ |
| `dashboard-wrapper` | 3-column grid            |
| `dashboard-card`    | Card container for stats |

---

# 💸 **12. Donations Page Classes**

(*Only used if needed*)

| Class              | Purpose                                    |
| ------------------ | ------------------------------------------ |
| `donation-summary` | Larger text used in donation summary pages |

---

# 🎯 **13. Folder Structure Summary**

```
css/
  base/
    reset.css
    variables.css
    typography.css
    utilities.css
  layout/
    layout.css
    header.css
    footer.css
  components/
    buttons.css
    forms.css
    tables.css
    cards.css
  pages/
    home.css
    dashboard.css
    donations.css
  styles.css   <-- imports everything
```
