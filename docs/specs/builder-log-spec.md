# Builder Log spec (v4)

## Identity
- Accent is --log-accent, with --log-accent-light for tinted backgrounds. Both are Builder Log identity tokens in globals.css that currently follow the site's blue --accent / --accent-light (8% in light, 10% in dark). --accent itself is reserved for interaction, so Builder Log components never use it directly. Throughout this spec, "accent" means --log-accent and "soft accent" means --log-accent-light. No amber anywhere in Builder Log. Status pills keep their existing colours.
- Fonts as the rest of the site: DM Serif Display for numerals and titles, Lora for log text, Inter for interface text.
- Icon: the existing BuilderLogIcon (a line through dots, last dot hollow), tinted with the accent.
- Must work in both themes through tokens only. No hard-coded hex values in components.

## Content model
- Series: src/content/builder-log/<series>/index.mdx (existing SeriesFrontmatter). Its MDX body is an optional "Meet the robot" intro.
- One log = one file: episode_<day>.mdx. The episode number IS the day number since the build started, so gaps are normal (1, 2, 4, 7...). Shown as "Day <episode>". Sorted by episode.
- Log frontmatter: id, title, episode, date (YYYY-MM-DD), thumbnail (16:9 image under public/content/builder-log/<series>/), thumbnailAlt (required when thumbnail is set), excerpt (one line, used as the homepage quote), highlight ("breakthrough" | "milestone" | absent), video (optional: a file path or YouTube id; when set, the cover becomes its poster with a play button), videoLength (optional, e.g. "0:28", the cover's duration chip), explore (optional list of Deep Dive series slugs, shown under the log as "Explore more"), plus the existing optional fields.
- Drafts: draft: true in a series' index.mdx (or a single log's frontmatter) hides it from production builds (pages, home feed, sitemap, profile tabs all treat it as missing) while it still shows in npm run dev.
- Body components: <Entry time="10:20">, <Toggle title="...">, <Compare>, <Gallery>/<Photo>, <Lesson>, plus the site's existing MDX components. Links out to Deep Dives go in the explore frontmatter, not the body.

## Series page, desktop (1100px and up) and tablet (700 to 1099px)
- Header, kept short so the newest log's title and the top of its cover show on a 900px-tall screen: kind row (icon + "Builder Log", status pill, category); H1 46px (40px tablet); the series description as one premise line; meta line "Started <first date> | <N> logs over <last day> days | Latest <last date>"; buttons "Start from Day 1" (becomes "Back to latest") and "New here? Meet the robot", which opens the index.mdx intro inline.
- Feed: centred column, max 852px: a 132px rail, 40px gap, 680px main column (tablet: 88px rail, 24px gap, flexible main).
- Rail: a thin vertical line with each log's node on it (dot, spark or diamond); small "Day" label; outlined DM Serif numeral, 72px (52px tablet), muted stroke; the log currently being read gets an accent stroke; the date; a "Latest" chip (accent background) on the newest log; "Breakthrough" (spark) or "Milestone" (diamond) label for highlighted logs. The rail is sticky (top 24px) while its log scrolls.
- Main column: title, DM Serif 32px (28px tablet); 16:9 cover, radius 12px (with a video: round play button in the centre, duration chip bottom-right, plays inline); the MDX body; an actions row with "Discuss this log", "Copy link" (copies /builder-log/<series>#day-<n>) and "Fold it back" when an unfolded log can fold again; then, when the log lists explore series, an "Explore more" section (the site's small section heading) with one home-page Deep Dive card per series, skipping series that don't exist (no section if none remain). "Explore more" appears on every screen size: the feed, the phone pager and the single-log share page.
- Entry: 52px time column (accent, Inter 600 12px, tabular numbers), then Lora 18px with 1.78 line height.
- Toggle: native details/summary. Bordered box, radius 12px, slightly raised background. Summary row at least 56px tall: a small icon tile (wrench, accent on --log-accent-light), then two lines, "Under the hood" (accent, 12px, 600) and the title (15px, 500), and a plus icon on the right that turns 45 degrees when open. Body in Inter 15px with 1.7 line height, muted; code blocks in monospace 13px on a darker background. Closed by default.
- Folding: the first 3 logs in the current order always show in full. Any later log whose body is taller than 720px folds: body max-height 300px, overflow hidden, fading out at the bottom. Below it, a pill button "Read the whole log" with a chevron, and a hint counted from the body's components, for example "Inside: 3 photos and a look under the hood". Content hidden by a fold is inert. Measure with ResizeObserver; short logs never fold.
- Order: newest first by default; "Start from Day 1" or ?order=oldest gives oldest first. End of the feed, newest first: "This is where it started." with "Read it from Day 1". Oldest first: "That's everything so far.", "The next log gets written the day something works.", with "Bookmark this build" (saves the whole series to the reader's bookmarks, listed in the profile's Builder Logs tab; signed-out readers go to sign in) and "Back to latest".
- Anchors: each log is a section with id="day-<n>". Landing on #day-<n> scrolls there and unfolds that log.

## Journey bar (700px and up)
- Fixed to the bottom, 64px tall, page background at 90% with blur, a hairline top border.
- Three parts: readout (250px: "Day N" DM Serif 25px accent, date 11.5px muted, title 13.5px with ellipsis; title hidden on tablet), the track, and the "Start from Day 1" / "Back to latest" button (accent outline pill).
- Track: a hairline, an accent fill from the first log to the current one, one node per log evenly spaced (by log, not by date). 14px glyphs: dot (past logs a lighter grey, future logs muted), spark in accent for breakthroughs, diamond in the text colour for milestones. After the last node: a 26px dashed line and a hollow, gently pulsing accent ring ("still going").
- A native range input sits on top for drag and keyboard. Thumb 20px (24px on tablet), accent, with a page-coloured border and a soft accent halo.
- Sync: the current log is the one whose top has passed 34% of the viewport height. Changing the range scrolls to that log.
- Peek: while hovering or dragging, a 244px card above the track at that node shows the thumbnail, "Day N" + date, and the title (DM Serif 15px). It stays inside the screen at the ends.
- Not included: setback symbols, gap markers, labels on hover, previous/next buttons, a bar that hides while scrolling.

## Phone (under 700px): one log per screen
- Site nav, then a 44px series strip (icon, series title with ellipsis, "<N> logs").
- The rest of the screen shows one log: header row (56px outlined accent numeral, date, chips), title 26px, cover, body, actions row, "Explore more". Nothing folds on a phone: the log always shows in full and its area simply scrolls, with enough bottom padding that the last lines, the actions and "Explore more" scroll clear of the pill. Changing logs resets that scroll to the top.
- Pill: fixed 14px from the sides and 8px from the bottom (plus safe area), 60px tall, fully rounded, raised background, border and shadow. At rest: left chevron (older), a middle button ("Day N" + date in accent, the title, a 2px progress line), right chevron (newer). At the ends a chevron is dimmed with aria-disabled.
- Swipe: pointer events, touch-action none. Moving more than 8px starts a drag (pointer capture starts then, so taps still reach the buttons). While dragging, the pill grows to 164px tall (radius 24px, 240ms ease). Top part: the target log's thumbnail (100px), "Day N" + date and a two-line title. Bottom part: a strip of nodes 48px apart (glyph + day number) that moves with the finger under a fixed highlighted window in the centre, faded at both edges. Target = current - round(dx / 48), clamped. On release: a quick flick (under 300ms, over 16px) moves exactly one log; a slower drag goes to the target. Finger moving right = older. The new log slides in like a carousel, following the finger: an older log from the left, a newer one from the right (30px plus fade, 320ms; the arrows do the same). Its scroll resets to the top, and the pill shrinks back.
- Tapping the middle opens the journey sheet: a bottom sheet (max 86% of the height, 20px top corners, dark scrim) titled "The journey" with "<N> logs over <D> days, newest first", buttons "Start from Day 1" / "Jump to the latest", then one row per log (104px thumbnail, "Day N" + date, title), the current row tinted with --log-accent-light. Tapping a row goes there and closes the sheet.
- The URL hash (#day-<n>) follows the current log via history.replaceState.

## Homepage banner (replaces BuilderLogCard everywhere)
- Used in the home feed / Library ("All" and a "Builder Logs" tab that appears only when a non-draft series exists) and, compact, in the Deep Dive reader's Explore sidebar. The layout follows the banner's own width (container queries), not the screen: desktop at 1040px and wider, tablet from 660px, phone below that.
- Full width, no card border or background, about 660px tall on desktop, a faint dot texture and a soft accent glow behind the latest log.
- Text: kind row + status pill, series title 46px as a link, premise.
- Road about 436px down: one node per log evenly spaced from the content's left edge to 80% of the width, then a dashed tail with the hollow ring and "The next log isn't written yet".
- Under the Day 1 node: "Day 1" + date and a "Start from Day 1" link (to the series page with ?order=oldest). The newest node is a filled accent circle with a glow.
- Cards: up to 3 highlighted logs, picked newest first, skipping any whose node would sit closer than one card width plus 16px to a card already picked at the current layout (desktop, tablet and phone/compact each pick their own set, checked at that layout's narrowest road). Fewer than 3 is fine. Each hangs on a 28px string under its node: 150px wide, 4px dark frame, slight tilts (-1.8, 1.3, -0.9 degrees), the 16:9 thumbnail (duration chip if it has a video), caption "Day N" + title.
- Latest: above the newest node, right-aligned, 410px wide: "Latest" (accent) + "Day N, date"; the log's excerpt as a quote in DM Serif italic 30px; the log title as a link; a "Read Day N" button. Cards, the title link and "Read Day N" go to the series page #day-<n>. Without an excerpt, the log title takes the quote's place.
- Tablet: the road sits in the flow under the text with room above for the quote block (quote 25px, block 340px); cards follow the same spacing rule at the tablet road width; "Start from Day 1" moves under the premise.
- Phone: the quote block sits in the flow under the title (quote 23px) with "Read Day N" and "Start from Day 1"; the premise is hidden; the road becomes a 900px-wide sideways-scrolling track that starts scrolled to the newest end, fading out on its left edge; "Swipe back to Day 1" hint; cards 124px. The page itself never scrolls sideways.
- Compact (Explore sidebar): always the phone layout, flat (no outer padding, dot texture or glow), quote about 20px.

## Thumbnails
- 16:9, 1280x720 (or 1600x900), never cropped anywhere. Rendered with next/image and sizes per slot (680, 244, 150, 104, 100px).
- Covers come from Canva: words on the left, robot on the right, a thin blue stripe along the bottom, no day number, bottom-right corner left clear for the clip length.

## Accessibility and motion
- Real buttons and links throughout. The range input has aria-valuetext "Day N, <date>: <title>". Pill buttons have labels. The sheet is a dialog with a focus trap and Escape to close.
- prefers-reduced-motion turns off the slide, pulse and grow animations.
- Text contrast at least 4.5:1 in both themes.
