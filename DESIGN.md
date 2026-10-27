---
name: Banco do Murilo
description: A personal money app dressed as a Windows XP program, modernized and comfortable, in light and graphite-dark.
colors:
  # Light theme (:root)
  title-blue: "#2463d6"
  pane-blue: "#2c64d4"
  select-blue: "#316ac5"
  head-ink: "#1f4fb5"
  link: "#1c4ab0"
  start-green: "#45b141"
  start-edge: "#1f6b1d"
  accent: "#2f9e35"
  accent-soft: "#e4f4e3"
  hover-glow: "#f5b742"
  danger-red: "#e3582f"
  balloon: "#ffffe1"
  balloon-edge: "#6f6b58"
  pos: "#237f2b"
  neg: "#cf3a2b"
  warn: "#e3a20f"
  warn-ink: "#875800"
  flame: "#ef7d1a"
  chrome-ink: "#ffffff"
  sky-top: "#b6d6f7"
  sky-bottom: "#e5f1fc"
  win: "#f6f8fd"
  panel: "#ffffff"
  panel-2: "#f0f4fc"
  btn-face: "#f5f4ef"
  btn-edge: "#3a5a99"
  panel-edge: "#b9cbec"
  edge: "#7f9bd8"
  rule: "#dfe6f4"
  ink: "#1d2a44"
  muted: "#55617b"
  faint: "#8790a6"
  # Dark theme ([data-theme="dark"])
  title-graphite: "#363c49"
  pane-blue-dark: "#2c3a55"
  select-blue-dark: "#3d6fc2"
  head-ink-dark: "#9cc2ff"
  link-dark: "#8cb8ff"
  accent-dark: "#5cc464"
  accent-soft-dark: "#1d2f20"
  hover-glow-dark: "#d99a2b"
  balloon-dark: "#2a2f38"
  balloon-edge-dark: "#5a6274"
  pos-dark: "#6fd277"
  neg-dark: "#ff7a68"
  warn-dark: "#f0b429"
  flame-dark: "#f59a4a"
  sky-top-dark: "#0b1631"
  sky-bottom-dark: "#172d52"
  win-dark: "#161a21"
  panel-dark: "#1e232c"
  panel-2-dark: "#262c37"
  btn-face-dark: "#333945"
  btn-edge-dark: "#5b6578"
  panel-edge-dark: "#343c4b"
  edge-dark: "#4c5669"
  rule-dark: "#2c3340"
  ink-dark: "#e8ecf5"
  muted-dark: "#a6b0c5"
  faint-dark: "#7c869c"
typography:
  display:
    fontFamily: "'Trebuchet MS', 'Fira Sans', 'Segoe UI', sans-serif"
    fontSize: "clamp(44px, 12vw, 68px)"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.02em"
    fontFeature: "'tnum'"
  headline:
    fontFamily: "'Trebuchet MS', 'Fira Sans', 'Segoe UI', sans-serif"
    fontSize: "clamp(26px, 7vw, 36px)"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.01em"
  title:
    fontFamily: "'Trebuchet MS', 'Fira Sans', 'Segoe UI', sans-serif"
    fontSize: "15px"
    fontWeight: 700
    lineHeight: 1.2
  figure:
    fontFamily: "'Trebuchet MS', 'Fira Sans', 'Segoe UI', sans-serif"
    fontSize: "22px"
    fontWeight: 700
    lineHeight: 1.2
    fontFeature: "'tnum'"
  start:
    fontFamily: "'Trebuchet MS', 'Fira Sans', 'Segoe UI', sans-serif"
    fontSize: "18px"
    fontWeight: 700
    lineHeight: 1.1
  body:
    fontFamily: "Tahoma, Verdana, 'Segoe UI', 'Fira Sans', sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Tahoma, Verdana, 'Segoe UI', 'Fira Sans', sans-serif"
    fontSize: "12.5px"
    fontWeight: 700
    lineHeight: 1.5
    letterSpacing: "0"
rounded:
  sm: "5px"
  control: "6px"
  md: "8px"
  panel: "10px"
  lg: "12px"
  pill: "999px"
spacing:
  tight: "6px"
  sm: "8px"
  md: "14px"
  card: "16px"
  lg: "20px"
  gutter-desktop: "26px"
components:
  titlebar:
    backgroundColor: "{colors.title-blue}"
    textColor: "{colors.chrome-ink}"
    typography: "{typography.title}"
    height: "40px"
    padding: "0 6px 0 10px"
  button:
    backgroundColor: "{colors.btn-face}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    height: "42px"
    padding: "0 16px"
  button-sm:
    backgroundColor: "{colors.btn-face}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    height: "34px"
    padding: "0 12px"
  button-primary:
    backgroundColor: "{colors.start-green}"
    textColor: "{colors.chrome-ink}"
    rounded: "{rounded.control}"
    height: "42px"
    padding: "0 16px"
  button-danger:
    backgroundColor: "{colors.danger-red}"
    textColor: "{colors.chrome-ink}"
    rounded: "{rounded.control}"
    height: "42px"
    padding: "0 16px"
  chip:
    backgroundColor: "{colors.btn-face}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    height: "34px"
    padding: "0 14px"
  chip-on:
    backgroundColor: "{colors.title-blue}"
    textColor: "{colors.chrome-ink}"
    rounded: "{rounded.pill}"
    height: "34px"
    padding: "0 14px"
  input:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    height: "46px"
    padding: "0 12px"
  card:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink}"
    rounded: "{rounded.panel}"
    padding: "16px"
  card-head:
    backgroundColor: "{colors.pane-blue}"
    textColor: "{colors.chrome-ink}"
    typography: "{typography.title}"
    height: "40px"
    padding: "9px 14px"
  tab:
    backgroundColor: "{colors.panel-2}"
    textColor: "{colors.muted}"
    height: "40px"
  tab-on:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink}"
    height: "40px"
  taskbar-start:
    backgroundColor: "{colors.start-green}"
    textColor: "{colors.chrome-ink}"
    typography: "{typography.start}"
    padding: "0 20px 0 12px"
  balloon:
    backgroundColor: "{colors.balloon}"
    textColor: "{colors.ink}"
    rounded: "{rounded.panel}"
    padding: "12px 16px"
---

# Design System: Banco do Murilo

## Overview

**Creative North Star: "The Reupholstered Desktop"**

The app is a program window sitting on Murilo's own early-2000s desktop: a sky-and-hill wallpaper behind, a glossy blue title bar on top, an Explorer-style task pane on the left, and a blue taskbar pinned to the bottom with a green "Lançar" button where Start used to be. Every piece of chrome is borrowed from Windows XP (bevelled buttons, gradient pane headers, a dotted focus outline, yellow tray balloons, segmented green progress blocks, round glossy status icons), and every piece has been reupholstered for comfort: reading-size type (15px body), generous padding, softened edges, a calm near-white window, and a full graphite dark theme in which the same window is rendered in charcoal instead of Luna blue.

Density is relaxed, not dense. Panels breathe with 14px between them and 16px inside; money is always the largest thing on any panel and always set in tabular figures. The direction was pinned by the owner ("bem anos 2000, Windows XP, modernizado, confortável, com modo escuro"), and it replaced a modern "reference manual" style he tried and rejected. It also rejects the generic banking-app look of white cards with a purple accent.

The chrome is loud and the content is quiet. Gloss, gradients and bevels live on the frame (title bar, taskbar, pane heads, buttons, icons); content surfaces are flat white (or flat graphite) panels with hairline blue-grey edges, so the numbers stay legible.

**Key Characteristics:**
- A window on a wallpaper: sky gradient with two drawn hills (night sky with stars and dark hills in dark mode).
- Glossy chrome, flat content: gradients belong to title bars, pane heads, taskbar and buttons, never to reading surfaces.
- Trebuchet MS for every title and every money figure; Tahoma for everything you read.
- Orange glow on hover, dotted outline on focus, sunken look for the active task.
- Green means "do it" (log, save, progress); blue means "you are here" (selection, active chip, active nav).
- Light Luna blue and dark graphite are two renderings of the same window, not two designs.

## Colors

A Luna palette: saturated XP blue and Start-button green on the chrome, pale blue-white panels for content, with a yellow balloon and an orange glow as the only warm accents.

### Primary
- **Luna Title Blue** (title-blue; graphite in dark as title-graphite): the title bar, the taskbar and active chips. Always a vertical gradient with a bright top highlight, never a flat fill; the hex is the gradient's midpoint. Text on it is white with a dark text-shadow.
- **Task Pane Blue** (pane-blue; pane-blue-dark): the horizontal gradient band that heads every card, the side panels ("Seções", "Detalhes") and the pane strip on desktop. It is how a panel says what it is.
- **Selection Blue** (select-blue; select-blue-dark): the single "you are here" color. Active side-nav row, selected category chip, today's calendar cell ring, text selection, input focus border, checkbox accent, spinner.
- **Heading Blue** (head-ink; head-ink-dark): the color of page titles, the hero balance, big figures inside panels, section titles and month labels. It is the "ink of importance".
- **Link Blue** (link; link-dark): underlined text links and the side-nav links on desktop.

### Secondary
- **Start Green** (start-green, edged by start-edge): the Start-button gradient. Reserved for the primary action: the "Lançar" taskbar button, `primary` buttons ("Gasto", "Novo lançamento"), the round month-nav arrows, the switch's on state, and no-spend "ok" days. It is the same in both themes.
- **Meadow Green** (accent; accent-dark) with **Mint Wash** (accent-soft; accent-soft-dark): savings and success. Soft buttons, "paid" status tags, the green chip-stat, the pots hero wash, chart accent lines.

### Tertiary
- **Hover Amber** (hover-glow; hover-glow-dark): the XP hover glow. An inset 2px ring on buttons, chips, pots, calendar days and template tiles; the 3px top stripe on the active tab.
- **Tooltip Cream** (balloon, edged by balloon-edge; balloon-dark in dark): tray balloons (toasts), chart tooltips, banners and verdict boxes. Anything that "speaks up" sits on cream.
- **Close Red** (danger-red): the glossy red of the XP close button. Used for the modal close button, destructive buttons, the danger insight icon and the red header strip on bill-day calendar leaves.

### Neutral
- **Window White** (win; win-dark): the window body behind the panels.
- **Panel White** (panel; panel-dark) and **Pale Panel** (panel-2; panel-2-dark): content surfaces and their recessed variant (inactive tabs, summary tiles, calendar cells, simulator boxes).
- **Button Face** (btn-face; btn-face-dark) with **Button Edge** (btn-edge; btn-edge-dark): the bevelled default button, drawn as a three-stop vertical gradient from near-white to a warm grey (light) or graphite (dark).
- **Panel Edge** (panel-edge; panel-edge-dark), **Frame Edge** (edge; edge-dark) and **Rule** (rule; rule-dark): hairlines for panel borders, controls, and in-panel dividers respectively, in that order of strength.
- **Navy Ink** (ink; ink-dark), **Slate** (muted; muted-dark), **Faint** (faint; faint-dark): primary text, secondary text and labels, placeholders and chart axes.
- **Sky** (sky-top to sky-bottom; night versions in dark): the wallpaper gradient only.

### Semantic
- **Gain Green** (pos; pos-dark), **Spend Red** (neg; neg-dark), **Caution Amber** (warn with warn-ink for text; warn-dark), **Streak Orange** (flame; flame-dark). Income figures, expense figures and over-budget states, due-soon tags, and the no-spend streak. The calendar heatmap mixes Spend Red into the panel color at 16/32/52/76%.

### Named Rules
**The Gloss Belongs to the Frame Rule.** Gradients, bevels and highlights live on chrome (title bars, pane heads, taskbar, buttons, icon badges, jars, cards' plastic). Reading surfaces are flat Panel White or flat graphite. If text is longer than a label, it sits on a flat panel.

**The Green Means Go Rule.** Start Green marks the one action the screen wants you to take, and success. Blue marks where you are. Never swap them: a selected filter is blue, never green; the log button is green, never blue.

**The Two Renderings Rule.** Every token has a dark twin and every component must work with both. Dark mode keeps the XP shapes and bevels and swaps Luna blue chrome for graphite; Start Green, Close Red and the cream balloon (as dark slate) keep their roles.

## Typography

**Display Font:** Trebuchet MS (with Fira Sans, loaded from Google Fonts, then Segoe UI)
**Body Font:** Tahoma (with Verdana, Segoe UI, Fira Sans)
**Label/Mono Font:** Tahoma for labels; Lucida Console stack is defined (`--mono`) but not part of the visible system.

**Character:** The XP pairing itself: Trebuchet's humanist curves on every title bar and number, Tahoma's wide, sturdy letterforms for reading at small sizes. Fira Sans is the bridge on Android and Linux, where neither system face exists.

### Hierarchy
- **Display** (700, clamp(44px, 12vw, 68px), line-height 1, -0.02em, tabular): the available balance on Home. One per screen. Big-number cousins use the same face at fixed sizes: pots total clamp(36px, 10vw, 52px), no-spend counter clamp(56px, 16vw, 84px), invoice and pot detail 40px.
- **Headline** (700, clamp(26px, 7vw, 36px), line-height 1.1, -0.01em): the page head under the title bar ("Boa tarde, Murilo." / section name), in Heading Blue, with a 15px Slate subline.
- **Title** (700, 15px): window title bar text, card pane-head titles, modal titles (17px). White with a 1px dark text-shadow when on chrome.
- **Figure** (700, 22px, tabular): money inside panels (stats, pot values 26px, bill sums 21px, streak goal 24px). Stats strips scale with container width (clamp(12.5px, 4cqi, 24px)) so money never truncates.
- **Start** (700 italic, 18px; 19px on desktop; 15px in primary buttons): the italic Trebuchet of the Start button. Only on the green primary action and the "Banco do Murilo" wordmark (sidebar brand, sign-in title).
- **Body** (400, 15px, line-height 1.5): all running text, list rows (15px names, 12.5px Slate metadata), insights 14.5px. Hero sentence capped at 40ch.
- **Label** (700, 12.5px, Slate, sentence case, no tracking): field labels, stat captions, day headers. Never uppercase.

### Named Rules
**The Money Is Trebuchet Rule.** Every amount that matters is Trebuchet 700 with tabular figures. Amounts inside running text or list rows use Tahoma 700 with tabular figures. Money is never set in a light weight and never truncated.

**The Italic Is the Start Button Rule.** Italic Trebuchet appears only on the green go-action and the wordmark. Nothing else is italic.

**The Sentence Case Rule.** Labels and section titles are bold sentence case in Slate or Heading Blue. The system has no uppercase tracking labels.

## Layout

**Mobile (default, under 900px):** the window fills the screen. A 40px title bar sits at the top (respecting the safe area), the page head follows (18px top padding), and content runs in a single column with 14px side gutters, capped at 1060px. A fixed 62px taskbar spans the bottom: the green "Lançar" tab hugs the left edge (right corners rounded 18px), followed by equal-width task buttons (Início, Extrato, Potes, Mais) stacked icon-over-label at 11px.

**Desktop (900px and up):** the wallpaper shows around a centered window (max 1320px, 26px margin, 10px top corners) with a long soft drop shadow. Inside, a 236px task pane on the left holds the wordmark and two white floating panels ("Seções" nav, "Detalhes" net-worth) with pane-blue headers; the pane-blue color continues as a strip behind the page head so the left column reads as one piece. The content column gets 26px gutters. The taskbar drops to 48px, task buttons become fixed 156px horizontal tabs, and a lighter blue tray on the right shows the clock.

**Rhythm:** panels stack and grid with a 14px gap; tiles and buttons inside a panel sit 6 to 8px apart; cards pad 16px, hero panels 18 to 20px. Two-up grids open at 760px, the Home top row splits 1.05fr / 1fr at 1000px, settings go two-column at 960px. Repeating collections (pots, cards, medals, templates) use auto-fill grids with min(100%, Npx) tracks so nothing overflows on a phone.

**Dialogs:** on phones, a bottom sheet (max 92dvh, 12px top corners) that slides up; at 640px and up, a centered window (540px, 420px for small) that scales in.

## Elevation & Depth

Depth is XP-literal: bevels and inset highlights make chrome look like plastic, while panels float on a single soft ambient lift above the window. There is one shared panel elevation; everything else is a bevel, a ring, or a dialog shadow.

### Shadow Vocabulary
- **Panel lift** (`--lift`: `0 1px 2px rgba(20,45,100,.08), 0 8px 20px -14px rgba(20,45,100,.45)`; dark: `0 1px 2px rgba(0,0,0,.3), 0 10px 22px -14px rgba(0,0,0,.8)`): every card, stats strip, insights list, month nav, hero, pot. The only resting panel shadow.
- **Chrome bevel** (`inset 0 1px 0 rgba(255,255,255,.3 to .5)`): the top highlight on title bars, pane heads, taskbar, Start button, glossy icons. It is what makes a gradient read as plastic.
- **Hover glow** (`inset 0 0 0 2px var(--hover-glow)`): the amber hover ring on buttons, chips, pots, tiles and calendar cells.
- **Sunken task** (`inset 0 2px 4px rgba(0,0,0,.35)` over a dark wash): the active taskbar button, pressed in.
- **Selection ring** (`0 0 0 2px var(--panel), 0 0 0 4px var(--select)`): the selected swatch and today's no-spend day.
- **Window shadow** (`0 24px 60px -30px rgba(10,30,80,.7)`): the desktop app window on the wallpaper.
- **Dialog shadow** (`0 30px 60px -25px rgba(0,0,0,.55)`; bottom sheet `0 -10px 40px -10px rgba(0,0,0,.4)`): modals over a navy 45% backdrop.
- **Balloon shadow** (`2px 4px 14px rgba(0,0,0,.25)`): toasts and chart tips, offset down-right like XP balloons.

### Named Rules
**The One Lift Rule.** Content panels share a single elevation (`--lift`). Do not invent intermediate shadow levels; hierarchy comes from pane-head color and type size, not stacked shadows.

**The Ring, Not the Raise Rule.** Interactive surfaces respond to hover with the inset amber ring (or a brightness bump on glossy green), never by lifting or growing.

## Shapes

Softened XP: everything has a gentle radius, nothing is sharp and nothing is a blob. Small controls take 5px (title-bar buttons, task buttons, icon buttons), buttons and inputs 6px, side panels and tiles 8px, cards 10px, heroes, pots and dialogs 12px. Chips, tags, status pills and switches are full pills (999px). Pane heads inherit the card's top radius (9px) so the blue band clips cleanly.

Signature silhouettes: the Start tab (flat left edge, 18px rounded right end); round glossy orbs (month arrows, insight icons, no-spend days, streak flame) with an off-center radial highlight at 40% 30%; the jar (rounded square that fills from the bottom with its color, glass highlight over the top 45%); the bill-day calendar leaf (red header strip over a white page); credit cards at a 1.7 aspect ratio with a gold chip. Borders are always 1px; dashed borders mean "add something here" (add-pot tile, new category, templates, unearned medals).

## Components

### Buttons
Tactile and bevelled, like real XP buttons, but larger and calmer.
- **Shape:** gently curved (6px), 42px tall (34px small), 1px Button Edge border.
- **Default:** three-stop Button Face gradient, Navy Ink text, Tahoma 14px bold, 18px icon with 8px gap.
- **Primary:** Start Green gradient, white Trebuchet 15px bold italic with text-shadow, inset white highlight. One per view region.
- **Soft:** pale green gradient with a green border and green text, for secondary savings actions.
- **Danger:** glossy Close Red gradient with white text; danger-ghost keeps the default face with Spend Red text and border.
- **Hover / Focus / Active:** hover adds the 2px amber inset ring (primary brightens 6% and gets a white inner ring); focus is the global 2px dotted ink outline at 2px offset; active swaps to the pressed gradient. Disabled is 50% opacity with no shadow.
- **Icon button:** 40px square, 5px radius, button face. On the title bar it turns translucent white glass; in a dialog head it becomes the red close button.

### Chips
- **Style:** 34px pill, Button Face background, Panel Edge border, 13px bold.
- **State:** selected chips turn Luna Title Blue gradient with white text. Hover adds the amber ring. Small segmented controls (`seg-sm`) use the same chip language.
- **Category chips:** 68px-tall tiles (10px radius) with a large emoji over a 12px label; selected gets a Selection Blue border and 12% blue wash.

### Cards / Containers
- **Corner Style:** 10px (12px for heroes and pots).
- **Background:** Panel White (graphite panel in dark).
- **Shadow Strategy:** Panel lift only (see Elevation).
- **Border:** 1px Panel Edge.
- **Header:** a pane-blue gradient band (40px min, 9px 14px padding) bled to the card edges, carrying a white Trebuchet 15px title, optional 88% white meta text and white links or small buttons on the right.
- **Internal Padding:** 16px. List rows inside divide with 1px Rule lines.
- **Hero variants:** Home hero is a white-to-ice-blue wash; pots hero is a mint wash with green edge; no-spend hero is a peach wash with orange edge. Each has a graphite-tinted dark twin.

### Inputs / Fields
- **Style:** 46px tall, 6px radius, 1px blue-grey border (Frame Edge in dark), Panel White fill, faint inset shadow, 16px text (prevents zoom on iOS). Selects carry a blue chevron.
- **Label:** Label style above the control with 6px gap; helper text 12.5px Slate below.
- **Focus:** border turns Selection Blue with a 3px 25% blue halo.
- **Amount field:** the transaction amount is a borderless 50px Trebuchet figure, colored Spend Red for expenses and Gain Green for income.

### Navigation
- **Taskbar (all sizes):** Luna blue gradient bar with a bright top bevel. The green italic "Lançar" Start tab on the left, translucent task buttons in the middle, and on desktop the clock tray. The active task is sunken (dark inset wash). The "Mais" button opens a Start-menu-like grid of large glossy-blue icon tiles that invert to Selection Blue on hover.
- **Task pane (desktop):** white floating panel headed "Seções" with Link Blue rows (17px icons, 14px text); hover underlines, active row is solid Selection Blue with white bold text.
- **Tabs:** XP property-sheet tabs. Inactive tabs are Pale Panel with Slate text; the active tab joins the panel below, turns Navy Ink and gets a 3px amber stripe on top (expense/income tabs color their text red/green).
- **Month nav:** a white strip with round glossy green arrow orbs and a Heading Blue Trebuchet month label.

### Window Chrome (signature)
- **Title bar:** 40px (36px desktop) Luna blue gradient with a 22px glass icon badge, the white Trebuchet title "Section — Banco do Murilo" with text-shadow, and translucent glass buttons (sync status, hide values) on the right.
- **Dialogs:** a small window with the same title-bar header (sticky), the red close button, Window White body.

### Balloons
Yellow XP tray balloons. Toasts are cream with a 1px dark-olive edge, 10px radius, 14.5px bold text, an underlined action link and a rotated-square tail at the bottom right; they rise from above the taskbar (bottom-right on desktop). Chart tooltips, banners and plan verdicts use the same cream.

### Progress Bars
XP block progress: a 14px inset trough (1px Frame Edge, 4px radius) holding a glossy green fill sliced into 8px blocks with 2px gaps. Amber when near the limit, red when over. A thin 10px variant sits under pot minis.

### Jars (signature)
The pote is a glossy rounded-square glass (56px; 38px small, 108px detail) that fills from the bottom with the pot's own color to its percentage, with a white glass highlight over the top. Its emoji sits in the middle.

## Do's and Don'ts

### Do:
- **Do** put new screens inside the window: title bar with section name, page head in Heading Blue, content as Panel White cards with pane-blue headers.
- **Do** give every new token and component a dark twin under `[data-theme="dark"]`; dark chrome is graphite (title-graphite), not blue.
- **Do** use Start Green (gradient, white italic Trebuchet) for the single go-action of a region, and Selection Blue for current/selected state.
- **Do** set money in Trebuchet 700 with tabular figures, and let figures in strips scale with container width instead of truncating.
- **Do** use the amber inset ring for hover, the dotted 2px outline for focus, and the cream balloon for anything the app says to Murilo.
- **Do** keep the 14px panel rhythm, 16px card padding, 15px body and 46px inputs; comfort is part of the brief.
- **Do** draw chrome icons as inline 24px stroke SVGs (2px stroke, round caps), placed on glossy badges where the XP original had colored icons.
- **Do** reach for XP's own materials before inventing: bevels, pane heads, orbs, block progress bars, property-sheet tabs, balloons.

### Don't:
- **Don't** put gradients, gloss or text-shadow on reading surfaces or body text; gloss belongs to the frame.
- **Don't** fall back to the generic banking-app look: white cards with a purple accent, flat minimal chrome, or the "reference manual" style Murilo already rejected.
- **Don't** add uppercase tracked labels or eyebrows above headings; labels are bold sentence case.
- **Don't** use italic anywhere except the green Start action and the wordmark.
- **Don't** lift elements on hover or stack extra shadow levels; panels share one lift.
- **Don't** use Start Green for selection, or Selection Blue for the primary action.
- **Don't** place small (under 15px) white text on the light end of the Start Green or pane-blue gradients; white text there must be 15px+ bold with its dark text-shadow.
- **Don't** use Faint for text people need to read; it is for placeholders and chart axes only.
