# FYT logo: usage guidelines (one page)

**The combined mark "FYT – Find Your Trainer" is the primary logo, the usage form and the filing form.** It is the Converge symbol + "FYT" + "Find Your Trainer", always together. "FYT" never appears on its own as a logo or in any lockup. The symbol alone is reserved for the app icon, favicon, avatar and other square or small slots where the full name is shown next to it or is already known. Use **™**, not ®, until registration is granted.

**Symbol, Converge v2:** two paths merge into one Y. A small dot (the learner) and a larger dot (the trainer, about 1:1.6) sit on the arm axes with an equal gap. The stem ends in a plain round cap, with no third dot and no cross-lines. **Construction (256 grid):** 38-unit monoline, 45° arms, learner dot r17, trainer dot r27, 13-unit gaps. **Unit `x` = the trainer-dot diameter.**

## Versions (`final/svg/`, PNGs in `final/png/`)
| Use | File |
|---|---|
| **Primary, horizontal** | `fyt-horizontal.svg` (azure symbol, navy "FYT / Find Your Trainer") |
| **Primary, stacked** | `fyt-stacked.svg` |
| Dark UI | `fyt-horizontal-dark.svg`, `fyt-stacked-dark.svg` (sky symbol, white type) |
| Reversed on azure / navy / photos | `*-white.svg` (thinned reversed cut) |
| One colour | `*-navy.svg`, `*-black.svg` |
| Symbol only (icons only) | `fyt-symbol.svg` (+ `-navy`, `-black`, `-dark`, `-white`); `fyt-symbol-small.svg` for 16–32 px |
| App icons | `app-icons/`: iOS 1024 full-bleed; Android adaptive foreground, background and monochrome at 432 px |
| Web | `web/`: favicon.ico (16/32/48), favicon.svg (switches to sky in dark mode), apple-touch, 192/512, maskable, manifest, `<head>` snippet |
| Admin sidebar tiles | `tile-on-azure.svg`, `tile-on-navy.svg` |

## Clear space and minimum size
- **Clear space:** 1 `x` on every side. Inside the horizontal lockup, the symbol-to-type gap is 1 `x`. In the stacked lockup it is 0.75 `x`.
- **Minimum size:** the horizontal lockup is **40 px tall** (about 135 px wide) and the stacked lockup **64 px tall**. Below that, the "Find Your Trainer" letters (the i-dots first) close up, so switch to the symbol, with the name set in UI text beside it. Symbol: 16 px, using the small cut below 32 px. Print: horizontal lockup 10 mm tall, symbol 5 mm.

## Colour
| Role | HEX | RGB | Notes |
|---|---|---|---|
| Azure (symbol) | `#1E4FB8` | 30 79 184 | ≈ Pantone 2728 C / CMYK 95 70 0 0 (proof before print) |
| Azure deep | `#1A45A0` | 26 69 160 | app-icon and nav gradient end, backgrounds only |
| Navy (type, ink) | `#0F1A36` | 15 26 54 | one-colour default |
| Navy deep | `#0B1328` | 11 19 40 | dark surfaces |
| Sky (symbol on dark UI) | `#6FA0FF` | 111 160 255 | dark theme only |
| White | `#FFFFFF` | | reversed |

Contrast: azure on white is 7.3:1, sky on `#0B1328` is 7.2:1, and white on azure deep is 8.7:1. The logo itself is always flat colour. Gradients appear only in backgrounds (app icon, sidebar). Teal is for progress UI and never the logo. No gold, brown or warm tones.

## Typography
"FYT" is Open Sauce One ExtraBold, tracked +2 %. "Find Your Trainer" is Open Sauce One SemiBold. Both are converted to outlines, the Y diagonals are snapped to 60°, and FY/YT are kerned by hand. Proportions use the symbol ink height H: FYT cap height 0.40 H, descriptor cap height 0.18 H, line gap 0.09 H. Do not retype it; use the files. Open Sauce One is OFL-licensed, so logo use is fine.

## Don'ts
- Don't use "FYT" alone as a logo, drop the descriptor from a lockup, or swap in another phrase.
- Don't make the dots equal, swap their sides or sizes, add a dot to the stem foot, or add lines inside the Y.
- Don't recolour outside the palette, or add gradients, shadows or outlines to the mark.
- Don't rotate, skew, stretch or mirror it, or put the azure symbol on azure.
- Don't bring back the old pin, or combine the two marks.
- Don't use the lockups below their minimum size, or the master symbol below 32 px.

## Audit notes
`svg_audit.py` passes on the symbols and the horizontal lockup. The warnings that remain are expected:
- The lockups have about 314 anchors, all from the outlined type.
- The app-icon and tile backgrounds use gradients by design.
- In the stacked lockup, the i-dots fall below 1/48 of the canvas. The 64 px minimum size covers this.
