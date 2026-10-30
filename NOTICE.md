# Third-party notices

The FYT operator console (`apps/admin`) uses the third-party assets below.
The same list is shown in the console at `/credits` ("Credits & licences").
Keep the two in step.

## Icons

| Asset | Author | Licence | Source | Where it is used |
| --- | --- | --- | --- | --- |
| Solar, bold duotone | 480 Design | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) | [Solar Icons Set](https://www.figma.com/community/file/1166831539721848736), packaged by Iconify as `@iconify-json/solar` | Navigation, page and section icons, KPI labels, drawer headers, command palette, empty states |
| Icons8 interface marks | Icons8 | [Icons8 free licence](https://icons8.com/license), link required | [Icons by Icons8](https://icons8.com) | Search fields, export buttons, the audit-log link, the approved seal, the credits menu entry |
| Lucide | Lucide contributors; parts derived from Feather by Cole Bennett | [ISC](https://github.com/lucide-icons/lucide/blob/main/LICENSE) (Feather-derived icons: MIT) | [lucide.dev](https://lucide.dev) | Small controls and the icon inside each status pill |
| Google Meet mark | Glyph data from Simple Icons | [CC0 1.0](https://github.com/simple-icons/simple-icons/blob/develop/LICENSE.md) (glyph data) | [simpleicons.org](https://simpleicons.org) | Online sessions and Meet links |

Changes made:

- **Solar**: only the icons in use are inlined (`apps/admin/scripts/gen-icons.mjs`
  writes `src/components/icons/solar-data.ts`). The second tone is drawn at
  reduced opacity in the surrounding text colour.
- **Icons8**: the marks were traced from the supplied images to single vector
  paths and recoloured. Sources are in `apps/admin/scripts/ui-icons/`;
  `scripts/gen-ui-icons.mjs` writes `src/components/icons/ui-icon-data.ts`.
  Marks in use: `search`, `export`, `audit`, `verified`, `certificate`.
  Icons by Icons8: https://icons8.com
- **Google Meet mark**: drawn in one colour. Google Meet is a trademark of
  Google LLC. The mark is used only to identify links that open in Google
  Meet; FYT is not affiliated with or endorsed by Google.

## Typefaces

| Typeface | Author | Licence | Source | Where it is used |
| --- | --- | --- | --- | --- |
| Open Sauce One | Alfredo Marco Pradil, The Open Sauce One Authors | [SIL Open Font License 1.1](https://openfontlicense.org) | [GitHub: marcologous/Open-Sauce-Fonts](https://github.com/marcologous/Open-Sauce-Fonts), self-hosted from `apps/admin/src/app/fonts/` (licence text: `OFL-OpenSauceOne.txt`) | All interface text: page titles, headings, body, labels, sign-in screen |
| JetBrains Mono | JetBrains, The JetBrains Mono Project Authors | [SIL Open Font License 1.1](https://openfontlicense.org) | [Google Fonts](https://fonts.google.com/specimen/JetBrains+Mono) | Figures, references, phone numbers, keyboard hints |

## Design references (21st.dev)

These community components informed a layout or an interaction. Each was
rebuilt in the console's own tokens; the file headers record what was and was
not taken from the source.

| Component | Author | Source | Used for | File |
| --- | --- | --- | --- | --- |
| Event Manager | vaib215 | https://21st.dev/@vaib215/components/event-manager | Day, Week and Month booking calendar layout. Reference only, no source code included | `src/app/(console)/bookings/booking-calendar.tsx` |
| Segmented Control | ddoemonn | https://21st.dev/@ddoemonn/components/segmented-control | Segmented view switch. Reference only, no source code included | `src/components/ui/choice.tsx` |
| Auth Section 1 | solaceui | https://21st.dev/@solaceui/components/auth-section-1 | Layout of the sign-in, verification and invite screens. Canvas 2D fallback grain redrawn after its grain gradient; the panel's WebGL fluid is our own and the source's shader is not included. The fluid's noise hash is "Hash without Sine" by Dave Hoskins (MIT) | `src/app/(auth)/login/` |
| Empty State | serafimcloud | https://21st.dev/@serafimcloud/components/empty-state | The tilted card fan in empty states | `src/components/ui/primitives.tsx` |
| OTPVerification | 21st.dev community | https://21st.dev | Sign-in code field | `src/components/ui/otp-input.tsx` |

## Software packages

Runtime dependencies and their licences are listed in
`apps/admin/package.json` and in each package under `node_modules`.
