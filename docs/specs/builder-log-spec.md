# Spec: Builder Log Component (v3)

## Layout Philosophy
- Sits flat on the homepage background (`--bg-primary`). No containers, borders, backgrounds, or box-shadows around the entire component itself.
- Left edge aligned with other primary library feed components (such as Deep Dive cards).
- The lower panel (dashed timeline & footer) is offset/indented to the right by `48px` compared to the main header section, creating a stepped, cascading visual layout.
- The upper divider line above the timeline section remains full-width (extending back across the `48px` offset to align flush with the header).

## Colors and Themes
- Identity Accent: `--amber` (`#c29300` in light theme, `#e5b83b` in dark theme).
- Uses `--amber-light` (`rgba(194, 147, 0, 0.06)` / `rgba(229, 184, 59, 0.08)`) for badge background overlays.
- Deep Dive accent remains `--accent` (periwinkle).

## Component Structure
1. **Hover Zone** (status pill, eyebrow, title link, premise/description, technology tags).
2. **Horizontal Divider** (full card width).
3. **Timeline Zone** (dashed vertical line, chronological log entries with date/label/title/description).
4. **Footer** (milestone milestones count + "Follow the Build" CTA with circle-arrow icon).

## Interactive Hover States & Reveal
- **Hover Zone Reveal**:
  - Hovering the **entire top block** (status badge through tags) triggers a 3-photo scatter animation.
  - Hovering the timeline below does **not** trigger the scatter.
  - The 3 photos are styled as Polaroid-style white frames with rotated offsets.
  - Dimensions: `260px` width, `195px` height.
  - Position: Positioned on the right side of the card, bleeding into the text area.
  - Stagger delay: ~80ms intervals (`0s` for photo1, `0.08s` for photo2, `0.16s` for photo3).
  - Reveal effect: Fade in, scale up from `0.4` to `1.0`, translate up, with overshoot easing.
  - Text dimming: Title and description text fade to `0.35` opacity when photos are revealed (creating the mystery-solving look).
  - Photos are purely decorative (`pointer-events: none`) in v1.
- **Log Timeline**:
  - No thumbnail images or hover offsets on log entries (logs remain flush against the timeline).
  - Active log (latest) has a solid amber circle indicator, older logs have a hollow indicator.
