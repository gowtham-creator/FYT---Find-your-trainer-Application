# Design System: Operator Console

## Scene
An operations admin at an Ameerpet training institute's front desk, mid-afternoon under bright tube lights, working a booking queue on a 15-inch laptop between phone calls. The owner reviews the same numbers on that laptop in the evening. That scene sets **light as the default**, with a deep navy dark theme for evening use that is as finished as the light one.

## Color strategy: Azure SaaS
A cool slate ground with navy ink and one brand hue, **Azure** (`#1E4FB8`), in the style of a SaaS super-admin console (modelled on the NXT Schools demo). Azure carries the sidebar, primary buttons, the focus ring, the current selection, the primary chart series and the brand bars on KPI cards and the sign-in card. Status colours are green, rose, sky, and red-orange for warnings only.

**Never in the console:** gold, amber, marigold, yellow, brown or any warm "paper" tint, and no purple, pink or violet (no "AI" gradients). The master brand files in `brand/` stay gold; the console renders the mark in azure (`components/brand/fyt.tsx`, `tone="azure" | "onDark"`). The four-colour Google "G" is the one exempt brand logo.

| Token | Light | Dark | Use |
|---|---|---|---|
| `--paper` | `#F5F7FB` | `#0B0F19` | page background, input fill on sign-in |
| `--surface` | `#FFFFFF` | `#141926` | panels, cards, tables |
| `--sunken` | `#EEF1F7` | `#0F1420` | segmented tracks, chart tracks, neutral pills |
| `--raised` | `#FFFFFF` | `#1C2233` | menus, tooltips |
| `--line` / `--line-strong` | `#E3E7EF` / `#CDD3DF` | `#232A3B` / `#2D364B` | hairlines |
| `--ink` | `#0F1B3D` | `#F1F3F8` | text |
| `--ink-2` | `#475472` | `#C6CBDA` | secondary text (≥4.5:1) |
| `--ink-3` | `#636B88` | `#8B92A6` | tertiary, placeholders, table headers |
| `--accent` | `#1E4FB8` | `#6FA0FF` | azure brand, primary buttons |
| `--accent-hover` | `#1A45A0` | `#8AB3FF` | primary hover |
| `--accent-soft` / `--on-accent-soft` | `#E8EFFC` / `#1A45A0` | `#1A2747` / `#A9C4FF` | icon tiles, selection, Owner pill |
| `--accent-ink` | `#FFFFFF` | `#0B1530` | text on azure |
| `--ok` | `#059669` | `#34D399` | confirmed, healthy |
| `--warn` | `#EA580C` | `#FB923C` | needs attention (status only, never decorative) |
| `--bad` | `#E11D48` | `#FB7185` | failed, destructive |
| `--info` | `#0284C7` | `#38BDF8` | info, Super admin pill, demo-data chip |
| `--nav-bg` → `--nav-bg-2` | `#1E4FB8` → `#1A45A0` | `#0F1A36` → `#0B1328` | sidebar gradient |
| `--nav-active-bg` / `--nav-active-ink` | `#FFFFFF` / `#1E4FB8` | `#6FA0FF` / `#0B1530` | active nav pill |
| `--viz-1` / `--viz-2` / `--viz-3` | `#2F6BDE` / `#0E9F8E` / `#0284C7` | `#6FA0FF` / `#2DD4BF` / `#38BDF8` | chart series: azure, teal, sky |
| `--brand-gradient` | azure → sky | light azure → sky | 3px bars on KPI cards and the sign-in card |

Each `*-soft` fill has an `--on-*-soft` text token that clears 4.5:1 on it. A status is never shown by color alone: every status pill pairs its color with an icon and a label.

## Typography
- **Open Sauce One** (`--font-sans` and `--font-display`, self-hosted with `next/font/local` from `apps/admin/src/app/fonts/`, SIL OFL 1.1) for everything: display, headings, body and labels. Body is 400; labels, buttons, nav items and pills are 500. **600 is allowed for page titles, panel titles, KPI values, the active nav item and sign-in headlines.** No 700 in the UI.
- **JetBrains Mono** (`--font-mono`, `.num`, `next/font/google`, SIL OFL 1.1) for numbers, IDs, booking refs, times, codes and kickers (`tabular-nums`). Mono values follow the size of the text around them. Times and timestamps are `whitespace-nowrap` so "11:00 am" never splits. KPI values are Open Sauce One 600 with `tabular-nums`, not mono.
- Scale: page H1 26px/600/-0.02em; panel title 15px/600 (`text-body`); KPI value 28px/600/-0.02em; nav item 14px/500 (`text-meta`); table header 12px uppercase 0.05em (`text-micro`); pills 13px/500; sign-in H1 26px/600; sign-in panel headline 40-44px/600/-0.025em; drawer and dialog titles 18px/600.
- UI text sizes come from five tokens in `globals.css` (`@theme inline`). Use them; do not add arbitrary `text-[Npx]` below 16px.

  | Token | Size / line-height | Use |
  |---|---|---|
  | `text-body-lg` | 16 / 24 | Large buttons, login inputs |
  | `text-body` | 15 / 22 | Body (the `body` default), panel titles, table cells, form inputs, drawer facts |
  | `text-meta` | 14 / 20 | Nav items, secondary text, descriptions, small buttons, relative times |
  | `text-caption` | 13 / 18 | The floor: pills and badges, chart ticks and legends, timestamps, helper text, kbd hints, avatar initials |
  | `text-micro` | 12 / 16 | Uppercase tracked labels only (eyebrows, nav group labels, table headers, KPI labels, kickers) |

  Tailwind's `text-xs` and `text-sm` are remapped to 13 and 14 so they cannot drop under the floor. Nothing renders below 12px, and larger text that overflows is fixed with layout (wrapping, min-widths, truncation with a `title`), never by shrinking it.

## Shape, depth, motion
- Radii: 8px for controls, 10px for nav items and icon tiles, 14px for panels and cards, 16px for overlays, 20px for the sign-in card, and fully rounded (999px) pills and badges.
- Panels, tables and KPI cards carry a soft long card shadow (`--shadow-card`); menus, the drawer and the command palette use `--shadow-overlay`. Shadows are tinted toward navy.
- Secondary buttons and topbar icon buttons lift 1px on hover. Motion runs 150–300ms with ease-out-quart and animates transform and opacity only: pages fade up 6px on route change, the drawer slides in, menus rise, and the sign-in panel's gradient crossfades and its glows float slowly. Everything respects `prefers-reduced-motion`.

## Layout
- A 256px sidebar on the blue `--nav-bg` gradient, collapsible to 64px, becoming a sheet below `lg`: white mark and wordmark, a role tag pill, uppercase group labels, and a **white active pill** with blue text. A 64px frosted top bar shows breadcrumbs, the demo-data chip, a wide ⌘K search, theme and the account pill.
- Content is capped at `max-w-[1400px]` with a 16px grid gap. Overview is asymmetric (2fr / 1fr): the action queue and today on the left, the bookings trend and activity on the right.
- **KPIs are separate cards** in a 2-up / 4-up grid, each with a 3px brand-gradient (or teal / sky / green) top bar, an uppercase label, a 28px/600 value, a delta pill and a 38px icon tile.
- Tables are the primary data affordance: a card with an uppercase 12px header on surface, 11px row padding, a faint azure row hover, a sticky header, a bulk-select bar and skeleton rows. Panels are cards (surface, hairline, card shadow); their header has no full-width divider.
- Editing happens in a right-side drawer, not a centered modal. Destructive confirmations use a small anchored dialog.
- Sign-in: an animated azure panel on the left (cool glows and white floating paths only), and a calm slate column on the right with a 420px, 20px-radius card topped by a brand bar.

## Charts
Azure first, teal second, sky third; never orange or amber series. Columns are up to 22px wide with a 6px top radius over dashed gridlines. Trends use an area chart (2px line, gradient fill from 28% to 0). Splits use a donut (18px stroke on a `--line` track, total centred). Legends use 9px round dots. Every chart has a table view or an accessible label.

## Components
Button (primary = solid azure, secondary = surface + line with a 1px hover lift, ghost, danger, each with a loading state), Input/Select/Textarea (label above, helper, error below; azure focus ring), StatusPill and RoleBadge (fully rounded tints, `onDark` variant for the sidebar), DataTable, Drawer, ConfirmDialog, CommandPalette, EmptyState (teaches the next action), Skeleton, Toast (sonner), PermissionLock (explains which role unlocks a module).
