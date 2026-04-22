# Design System Specification: The Architectural Archive

## 1. Overview & Creative North Star

### Creative North Star: "The Architectural Archive"
This design system moves away from the "government portal" trope of cluttered links and heavy borders. Instead, it adopts the persona of a **High-End Editorial Archive**. It is built on the principles of structural honesty, monumental typography, and intentional negative space. 

By treating data as a premium asset, we transform "transparency" from a legal requirement into a civic experience. We break the "template" look by utilizing **intentional asymmetry** (e.g., large left-aligned display type balanced by expansive right-side whitespace) and **tonal layering** instead of structural lines. The goal is a UI that feels solid, secure, and effortlessly navigable.

---

## 2. Color Philosophy & Tonal Layering

Our palette is anchored in the authority of **Deep Navy (#00193c)** and the vitality of **Emerald Green (#006c47)**. 

### The "No-Line" Rule
**Explicit Instruction:** Designers are prohibited from using 1px solid borders to define sections or containers. 
Structure must be achieved through:
- **Background Shifts:** Using `surface-container-low` sections against a `surface` background.
- **Tonal Transitions:** Defining an area by shifting from `surface-container-lowest` to `surface-container-high`.
- **Negative Space:** Using the spacing scale to create "invisible boundaries."

### Surface Hierarchy & Nesting
Treat the UI as physical layers of fine paper. 
- **Base Layer:** `surface` (#f8f9ff)
- **Content Blocks:** `surface-container-low` (#eff4ff)
- **Prominent Cards:** `surface-container-lowest` (#ffffff) to provide a "lifted" appearance without heavy shadows.

### Glassmorphism & Signature Textures
For floating elements (modals, dropdowns, or sticky headers), use **Glassmorphism**:
- Background: `surface` at 80% opacity.
- Effect: 20px - 40px Backdrop Blur.
- Result: The content feels integrated into the environment, not "pasted" on top.

For Hero sections, use a **Signature Texture**: A subtle gradient transition from `primary` (#00193c) to `primary_container` (#002d62) at a 135-degree angle. This adds a "soul" to the depth that flat colors cannot provide.

---

## 3. Typography: The Editorial Voice

We utilize a dual-typeface system to balance high-end aesthetics with technical precision.

### Typeface Selection
- **Display & Headlines (Manrope):** A modern geometric sans-serif. Used for "The Hook." Large scales (Display-LG to Headline-SM) should have tight letter-spacing (-2%) to feel authoritative and "architectural."
- **Body & Data (Inter):** A workhorse for readability. Used for "The Fact." Inter’s high x-height ensures that complex financial tables remain legible even at small sizes (Label-MD).

### Hierarchy as Identity
- **Bold Contrast:** Pair a `display-md` headline (Manrope, Extra Bold) with `body-md` (Inter, Regular). The jump in scale creates an editorial feel that guides the eye immediately to the most important data point.
- **Data Emphasis:** In transparency tables, use `title-md` for primary figures (e.g., budget amounts) and `label-sm` in `on_surface_variant` for metadata (e.g., date of entry).

---

## 4. Elevation & Depth

### The Layering Principle
Depth is achieved by "stacking" the surface-container tiers. Placing a `surface-container-lowest` (#ffffff) card on a `surface-container-low` (#eff4ff) section creates a soft, natural lift.

### Ambient Shadows
Shadows must be "atmospheric." 
- **Formula:** Blur: 32px | Spread: -4px | Color: `primary` at 6% opacity.
- **Application:** Use only for high-priority interactive elements like a main "Search" bar or a floating "Contact" button.

### The "Ghost Border" Fallback
If a border is required for accessibility (e.g., input fields), use a **Ghost Border**: 
- Token: `outline-variant` (#c4c6d1) at **20% opacity**. 
- Never use 100% opaque, high-contrast borders.

---

## 5. Components

### Buttons: High-Impact Solids
- **Primary:** `primary` (#00193c) background with `on_primary` (#ffffff) text. Corner radius: `md` (0.375rem).
- **Secondary (Growth):** `secondary` (#006c47) background. Use this specifically for "Success" actions or "Download Report" actions to tie growth to transparency.
- **States:** On hover, do not change color; instead, apply a `primary_container` (#002d62) background shift.

### Input Fields: Minimalist Security
Avoid the "box" look. Use a `surface-container-highest` background with a `sm` (0.125rem) bottom-only accent in `primary`. This feels more like a sophisticated form and less like a standard template.

### Data Visualization: Premium Insight
- **The "No-Line" Table:** Remove all vertical and horizontal lines. Use alternating row colors ( `surface` and `surface-container-low`) for readability.
- **Charts:** Use `secondary` (#006c47) for positive trends and `error` (#ba1a1a) for deficits. Bars should have rounded terminals (`full` radius) to match the "soft but firm" philosophy.
- **Focus:** Use high-contrast typography within charts. A single, large `display-sm` number should summarize the entire chart’s intent.

### Chips: Metadata Tags
Use `secondary_container` (#8af5be) with `on_secondary_container` (#00714b) for status tags (e.g., "Published," "Approved"). This emerald-on-light-green pairing screams "Trust."

---

## 6. Do's and Don'ts

### Do:
- **Do** use massive amounts of whitespace. If a section feels "full," it is probably too crowded for this system.
- **Do** use `manrope` for any text larger than 24px.
- **Do** align data to a strict 8px grid, but allow layout elements (images/decorative blocks) to break the grid for an editorial feel.
- **Do** use backdrop blurs on sticky navigation bars.

### Don't:
- **Don't** use 1px solid borders to separate content.
- **Don't** use standard "drop shadows" with high-opacity black.
- **Don't** use generic blue icons. Use custom, thick-stroke (2px) icons in the `primary` color.
- **Don't** use center-aligned text for long paragraphs; keep it strictly left-aligned for a "solid" architectural edge.