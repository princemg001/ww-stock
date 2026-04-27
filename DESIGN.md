# Design Brief — WW Stock

## Aesthetic
Industrial warehouse minimal. Dark, utilitarian, high contrast. Function over decoration.

## Brand Voice
Professional, scannable, purposeful. No flourish.

## Palette

| Token | Light | Dark |
| --- | --- | --- |
| **Background** | `0.98 0 0` (off-white) | `0.11 0 0` (deep charcoal) |
| **Foreground** | `0.12 0 0` (near black) | `0.95 0 0` (bright white) |
| **Primary** | `0.58 0.19 37` (warm orange) | `0.68 0.22 40` (bright amber) |
| **Accent** | `0.58 0.19 37` (warm orange) | `0.68 0.22 40` (bright amber) |
| **Border** | `0.88 0 0` (light grey) | `0.25 0 0` (dark grey) |
| **Destructive** | `0.55 0.22 25` (red) | `0.65 0.19 22` (bright red) |

## Typography
- **Display:** General Sans, 16–32px, semibold, geometric precision
- **Body:** General Sans, 14–16px, regular, 1.5 line height
- **Mono:** JetBrains Mono, 12–14px, logs and stock codes

## Shape Language
- **Radius:** 4–8px, minimal curves, sharp industrial edges
- **Borders:** Always present on cards, 1px solid
- **Shadows:** Subtle depth (md/lg), no glow or neon

## Elevation & Depth
- **Card:** 1px border + soft shadow-md, elevated from background
- **Input:** 1px border on light grey, focus ring in primary orange
- **Button CTA:** Solid primary background, white text, shadow-md

## Structural Zones
| Zone | Treatment |
| --- | --- |
| **Header** | Card background with 1px border-b, sticky or fixed nav |
| **Content** | Background with card-based product listings, grid or table |
| **Footer** | Light muted bg with border-t, optional footer links |
| **Sidebar** | Dark card bg, primary accent for active nav, vertical list |

## Component Patterns
- **Cards:** 1px border, rounded-sm, shadow-md, image + metadata
- **Buttons:** Solid primary (CTA), ghost secondary (cancel), full width in forms
- **Tables:** Striped rows (bg alternating), 1px borders, compact density
- **Lists:** Product cards in grid (mobile: 1, tablet: 2, desktop: 3+), search bar above
- **Forms:** Stacked vertical, white input fields with 1px border, required validation

## Motion
- **Transitions:** 0.3s ease-out on hover, focus, and state changes
- **No animations:** Loading states use spinner only, no floating elements

## Signature Detail
High-contrast dark mode + bold warm orange CTAs + minimalist card stacks + industrial typography = memorable warehouse inventory UI that prioritizes scannability.

## Constraints
- No gradients, blurs, or glassmorphism
- No decorative illustrations or patterns
- Functional imagery only (product photos)
- Monochromatic cards with single accent color for actions
