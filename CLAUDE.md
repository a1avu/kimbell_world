# CLAUDE.md — Pixel Fantasy Cybersecurity Blog

## Goal
Build a static GitHub Pages blog for cybersecurity and hacking study notes.

The site should feel like an explorer's journal in an original pixel-fantasy world:
- Full-screen pixel-art hero scene
- Floating game-window style post list
- Post cards open in an accessible modal
- Every post also has a permanent URL
- Readability, accessibility, mobile support, and performance come first

## Core Rules
- Inspect the repository before editing.
- Preserve any existing framework or structure.
- If empty, use semantic HTML, CSS, and small vanilla JavaScript.
- Do not add unnecessary frameworks or animation libraries.
- Do not delete or rewrite unrelated files.
- Use an original fantasy character and world.
- Never copy recognizable Zelda characters, clothing, symbols, castles, weapons, dragons, or UI.
- Pixel fonts are only for short headings, labels, tags, and buttons.
- Use a readable sans-serif font for article text.
- The modal is an enhancement; posts must remain accessible by normal links.

## Main Screen
Use a hero section with `min-height: 100svh`.

Scene composition:
- Anonymous hooded traveler seen from behind in the lower-left
- Distant floating palace in the upper-right
- Dragon crossing the sky near the palace
- Cliffs, grass, stones, and ancient ruins in the foreground
- Calm central area reserved for readable UI panels
- No text, logo, buttons, or UI inside the artwork
- Add a subtle dark overlay over the background

Navigation:
- Semi-transparent pixel panel, about 56–68px high
- Blog name on the left
- Archive, Categories, About, and Search on the right
- Collapse to a mobile menu on small screens

Explorer status panel example:
```text
PLAYER: Security Explorer
STATUS: Learning
CURRENT QUEST: OSCP / HTB
LOGS FOUND: 24
```

Latest-post panel:
- Show 3–5 cards
- Include category, date, title, two-line excerpt, and reading time
- Use semantic `a` or `button`, never clickable `div`
- Hover: 2–4px lift, brighter border, small pixel cursor
- Respect `prefers-reduced-motion`

## Post Modal
Desktop:
- `width: min(920px, calc(100vw - 40px))`
- `max-height: calc(100svh - 48px)`
- Scroll article content inside the modal
- Use a dark backdrop and 3–4px pixel border

Mobile:
- Near-full-screen layout
- Fixed title bar
- Close target at least 44×44px
- Body padding 18–22px

Title bar:
- Category or icon
- Post title
- `Open Page` permanent link
- Close button

Required behavior:
- Open from a card
- Close with Escape, backdrop, or close button
- Lock background scrolling
- Trap focus inside the dialog
- Return focus to the original card
- Use `role="dialog"`, `aria-modal`, and a labelled title
- Reflect the post slug with hash or History API
- Support direct URL, refresh, back, and forward navigation
- Keep a normal link fallback without JavaScript

Animation:
- 160–220ms
- Opacity plus subtle `scale(0.97 → 1)`
- No bounce, flashing, rotation, or excessive glitch

## Colors
```css
:root {
  --sky-top: #6f7fe8;
  --sky-bottom: #b8c6ff;
  --twilight: #39466f;
  --deep-night: #202942;

  --panel-bg: #f4f1e7;
  --panel-bg-soft: rgba(244, 241, 231, .94);
  --panel-dark: #222a3d;
  --panel-dark-soft: rgba(34, 42, 61, .94);

  --text-main: #202434;
  --text-muted: #687087;
  --text-on-dark: #f5f3e9;
  --text-on-dark-muted: #bdc6dc;

  --accent-gold: #f1c75b;
  --accent-mint: #49d6a7;
  --accent-violet: #8c7cf0;
  --accent-coral: #e97878;
  --accent-blue: #6fa8ff;

  --border-dark: #1a2132;
  --border-mid: #56617d;
  --shadow-pixel: rgba(16, 21, 34, .55);
  --scene-overlay: rgba(18, 24, 43, .24);
  --modal-backdrop: rgba(10, 14, 26, .68);
}
```

Color use:
- Gold: quests, selection, important links
- Mint: progress and success
- Violet: categories and encryption motifs
- Coral: warnings and errors only
- Use at most two strong accent colors per view
- Never place body text directly over a complex background
- Target WCAG AA contrast

## Typography
```css
:root {
  --font-pixel: "Galmuri11", "DungGeunMo", ui-monospace, monospace;
  --font-body: "Pretendard", "Noto Sans KR", -apple-system,
               BlinkMacSystemFont, "Segoe UI", sans-serif;
  --font-code: "JetBrains Mono", "SFMono-Regular", Consolas, monospace;
}
```

- Body: 16px minimum on mobile, 17–18px on desktop
- Body line-height: 1.7–1.85
- Apply `image-rendering: pixelated` only to actual pixel artwork
- Use hard pixel shadows instead of large blurry shadows
- No autoplay music, Matrix rain, or neon hacker-room clichés

## Image Generation Prompt
Desktop, 16:9:

```text
Create an original cinematic pixel-art fantasy landscape for the full-screen hero background of a cybersecurity learning blog. A small anonymous fantasy traveler is seen only from behind on a grassy cliff in the lower-left, wearing a weathered hooded cloak and carrying an old sword or staff. The traveler looks toward an enormous distant palace floating above mountains and clouds in the upper-right. A long majestic dragon glides near the palace in a gentle S-shaped path. Add ancient stone fragments and subtle glowing runes suggesting exploration, encrypted knowledge, and forgotten technology.

Authentic detailed 16-bit to 32-bit pixel art, crisp intentional pixels, layered atmospheric perspective, soft dusk lighting, lavender-blue sky, pale clouds, muted green cliffs, restrained gold highlights, mysterious but hopeful mood. Keep the center calm and uncluttered for website panels. No text, logo, watermark, or UI.

Use a completely original character and world. Do not reproduce or closely imitate any copyrighted character, costume, symbol, weapon, castle, dragon, or franchise-specific identity. Wide 16:9, 1920x1080, website hero background.
```

Mobile, 9:16:

```text
Create a vertical mobile version of the same original pixel-fantasy landscape. Place the anonymous hooded traveler in the lower foreground, the floating palace near the upper center, and the dragon across the upper sky. Keep all three visible in a narrow crop and leave a calm middle area for readable UI panels. Crisp detailed 16-bit to 32-bit pixel art, lavender-blue dusk sky, muted green cliffs, pale clouds, restrained gold accents. No text, logo, watermark, UI, or recognizable franchise elements. Vertical 9:16, 1080x1920.
```

Negative prompt:

```text
photorealistic, 3D render, vector art, anime close-up, visible face,
copyrighted character, recognizable franchise costume, green pointed cap,
triforce-like symbol, branded weapon, franchise castle, text, logo, watermark,
UI mockup, cyberpunk city, neon hacker room, oversaturated colors,
blurry pixels, mixed pixel sizes, excessive detail behind text
```

Recommended files:
```text
assets/images/hero-world-desktop.webp
assets/images/hero-world-mobile.webp
```

## Content and Routing
Each post should expose:
```json
{
  "slug": "example-post",
  "title": "Example Security Log",
  "date": "2026-07-22",
  "category": "Hack The Box",
  "tags": ["web", "linux"],
  "excerpt": "Short card description",
  "readingTime": "8 min"
}
```

- Give every post a permanent URL.
- Keep heading order logical: `h1 → h2 → h3`.
- Code blocks need language labels, copy actions, and horizontal scrolling.
- Support `NOTE`, `TIP`, `WARNING`, `DANGER`, and `LAB ONLY`.
- Frame offensive-security content for legal labs and authorized systems.

## GitHub Pages and Performance
- Support project paths such as `/repository-name/`.
- Do not assume deployment at domain root.
- Prefer compressed WebP images.
- Aim for roughly 300–500KB for the initial hero image when practical.
- Lazy-load noncritical images.
- Keep the first version deployable as static files.

## Workflow
Before editing:
1. Inspect the repository and current stack.
2. Read relevant existing files.
3. Preserve existing behavior.
4. Use the smallest reasonable change.
5. Give a short plan before large changes.

Implementation priority:
1. Responsive hero
2. Post cards
3. Accessible modal
4. Permanent post URLs
5. Archive
6. Search and category filters
7. Extra animation

If artwork is missing, complete the layout with a gradient placeholder first.

Before finishing, test:
- Desktop
- 768px tablet
- 390px mobile
- Keyboard-only navigation
- Modal focus behavior
- Direct post URL and refresh
- Browser back and forward
- GitHub Pages subpath
- Reduced-motion mode

End with a summary of changed files, implemented behavior, and unresolved issues.

## Final Check
- Fantasy exploration mood is immediate
- Cybersecurity-study purpose is clear within five seconds
- UI and article text are easier to read than the background
- The world looks original, not copied
- Opening a post feels like opening a small game window
- Long articles and code remain comfortable to read
- Traveler, dragon, and palace composition survives on mobile
- Core content remains accessible without JavaScript
- But all the contents and your respons should be korean

## Archive (Quest Log)

Trigger: clicking "아카이브" in nav opens a full-screen quest-log
style overlay (reuses the existing modal/dialog system: focus
trap, Escape/backdrop close, URL hash `#/archive`).

Layout: two-pane game menu window (dark pixel-bordered panel).

Left pane — quest list:
- Grouped by category, each group collapsible
  (e.g. "웹 해킹 (8)", "HTB (12)")
- Each entry is compact: title + date only
- Keyboard arrow-key navigation between entries
- Search input at top filters the list live

Right pane — selected quest:
- Shows the selected post's full content directly inside this
  pane (reuse the markdown rendering from the post modal)
- If nothing selected yet, show a placeholder/empty state
  ("탐험할 기록을 선택하세요" or similar)

Data source: posts/index.json

Mobile: collapse to single-pane — list first, tapping an entry
replaces the view with the content pane and shows a back button.

Requirements:
- role="dialog", aria-modal, labelled title (reuse existing
  a11y pattern)
- Respect prefers-reduced-motion
- Keyboard accessible throughout (arrow keys, Enter to select,
  Escape to close)
- URL reflects both archive open state and selected post
  (e.g. #/archive/post-slug) so it's shareable/refreshable
