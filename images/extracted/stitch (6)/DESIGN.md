# Design System Specification: The Luminescent Sanctuary

## 1. Overview & Creative North Star
The Creative North Star for this design system is **"The Luminescent Sanctuary."** 

This is not a standard utility-first interface; it is a digital space designed to feel like a sun-drenched chapel at mid-morning. We achieve this by moving away from the rigid, boxed-in constraints of traditional Material Design and instead embracing **Organic Editorialism**. 

The goal is to evoke peace and joy through "light-filled" layouts. We break the "template" look by utilizing intentional white space (using the `20` and `24` spacing tokens), staggered asymmetrical compositions, and soft, overlapping elements that mimic the way light falls across a room. This system treats the screen as a canvas of light rather than a grid of containers.

---

## 2. Colors & Surface Philosophy
The palette is built on warmth and spiritual vibrance. The foundation is never stark; it is rooted in the warmth of `#fdf9e9` (Surface).

### The "No-Line" Rule
To maintain the "Sunlight" aesthetic, **1px solid borders are strictly prohibited** for sectioning or containment. Boundaries must be defined through:
*   **Tonal Transitions:** Moving from `surface` to `surface-container-low` to define a new area.
*   **Soft Shadows:** Using ambient, tinted depth to imply edges.
*   **Whitespace:** Using the `8` (2.75rem) or `12` (4rem) spacing tokens to create mental boundaries.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers of fine vellum paper.
*   **Base:** `surface` (#fdf9e9) for the main page.
*   **Sections:** `surface-container-low` (#f8f4e4) for secondary content areas.
*   **Elevated Elements:** `surface-container-lowest` (#ffffff) for high-priority cards to create a "bleached by sun" effect.
*   **Nesting:** When placing a card inside a section, the inner container should always be the lighter token (e.g., a `surface-container-lowest` card sitting on a `surface-container-low` section).

### The "Glass & Gradient" Rule
For CTAs and high-impact headers, use "Watercolor" gradients. Transition from `primary` (#835500) to `primary_container` (#f5a623) with a 45-degree angle. For floating navigation or overlays, apply **Glassmorphism**: use `surface` at 80% opacity with a `backdrop-filter: blur(12px)`.

---

## 3. Typography: Editorial Rhythm
We use **Plus Jakarta Sans** to balance modern precision with friendly, rounded terminals.

*   **Display (lg/md):** Reserved for moments of inspiration. Use `display-lg` (3.5rem) with tight letter-spacing (-0.02em) to create an authoritative yet warm editorial feel.
*   **Headlines:** `headline-md` (1.75rem) should be used for section titles, always paired with generous top-margin (Spacing `12`).
*   **Body:** `body-lg` (1rem) is our workhorse. Ensure a line-height of 1.6 to maintain the "airy" feel.
*   **The Intentional Scale:** Move between extremes. Pair a `display-sm` headline with a `label-md` uppercase caption to create high-contrast, premium layouts that feel designed, not just populated.

---

## 4. Elevation & Depth
Depth in this system is atmospheric, not structural.

*   **Tonal Layering:** Avoid shadows for static content. Use the `surface-container` tiers to create hierarchy.
*   **Ambient Shadows:** For interactive "floating" elements, use a custom shadow: `0px 12px 32px rgba(131, 85, 0, 0.08)`. Note the color: we use a tint of `primary` (#835500) rather than black to keep the shadow feeling like warm, reflected light.
*   **The "Ghost Border" Fallback:** If accessibility requires a border, use `outline_variant` at 15% opacity. It should be felt, not seen.
*   **Roundedness:** Adhere strictly to the `xl` (1.5rem / 24px) for major containers and `lg` (1rem / 16px) for buttons and inputs. This extreme rounding reinforces the "approachable" brand personality.

---

## 5. Components

### Buttons: The "Glow" State
*   **Primary:** Background: `primary` (#835500); Label: `on_primary` (#ffffff). Shape: `full`.
*   **Secondary:** Background: `secondary_container` (#8455ef); Label: `on_secondary_container` (#fffbff).
*   **Interactions:** On hover, primary buttons should not get darker; they should receive a soft glow using a spread shadow of the `primary_container` color.

### Cards: The "Frameless" Content
*   **Constraint:** No dividers. No borders.
*   **Execution:** Use `surface-container-lowest` for the card background. Use `Spacing 6` (2rem) for internal padding to give content room to "breathe."

### Input Fields: Soft Invitation
*   **Background:** `surface_container_high` (#ece8d9).
*   **Shape:** `lg` (1rem).
*   **Border:** None, except for a 2px `primary` bottom-bar only when focused.

### Charts: Watercolor Blends
*   **Visual Style:** Data series should use gradients (e.g., `tertiary` to `tertiary_fixed_dim`).
*   **Gridlines:** Use `outline_variant` with a `stroke-dasharray="4 4"`. Gridlines should be soft and recede into the background.

---

## 6. Do’s and Don’ts

### Do:
*   **Do** use asymmetrical layouts. Place an image slightly off-center or overlapping a container.
*   **Do** use `tertiary` (#00668a) for "Hope" elements—success states, progress bars, and uplifting callouts.
*   **Do** lean into white space. If a layout feels "crowded," double the spacing token.

### Don’t:
*   **Don’t** use Dark Mode. This system is defined by light; darkness contradicts the "Sunlight" metaphor.
*   **Don’t** use pure black (#000000) for text. Always use `on_surface` (#1c1c13) to maintain warmth.
*   **Don’t** use sharp corners. Anything less than `md` (12px) is too aggressive for this brand.
*   **Don’t** use standard horizontal rules `<hr>`. Use a background color shift or 48px of vertical space instead.