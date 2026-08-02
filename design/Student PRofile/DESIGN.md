---
name: Timeless Altruism
colors:
  surface: '#fcf8fa'
  surface-dim: '#dcd9db'
  surface-bright: '#fcf8fa'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3f4'
  surface-container: '#f0edee'
  surface-container-high: '#eae7e9'
  surface-container-highest: '#e5e2e3'
  on-surface: '#1b1b1d'
  on-surface-variant: '#45464c'
  inverse-surface: '#303031'
  inverse-on-surface: '#f3f0f1'
  outline: '#76777d'
  outline-variant: '#c6c6cd'
  surface-tint: '#575e70'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#141b2b'
  on-primary-container: '#7d8497'
  inverse-primary: '#c0c6db'
  secondary: '#735c00'
  on-secondary: '#ffffff'
  secondary-container: '#fed65b'
  on-secondary-container: '#745c00'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#261906'
  on-tertiary-container: '#968065'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dce2f7'
  primary-fixed-dim: '#c0c6db'
  on-primary-fixed: '#141b2b'
  on-primary-fixed-variant: '#404758'
  secondary-fixed: '#ffe088'
  secondary-fixed-dim: '#e9c349'
  on-secondary-fixed: '#241a00'
  on-secondary-fixed-variant: '#574500'
  tertiary-fixed: '#f9debf'
  tertiary-fixed-dim: '#dcc2a4'
  on-tertiary-fixed: '#261906'
  on-tertiary-fixed-variant: '#55442d'
  background: '#fcf8fa'
  on-background: '#1b1b1d'
  surface-variant: '#e5e2e3'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-xl:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 30px
    fontWeight: '600'
    lineHeight: '1.25'
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  title-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1.4'
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1.2'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  xxl: 48px
  gutter: 24px
  margin: 32px
---

## Brand & Style
The design system embodies a premium, enterprise-grade aesthetic tailored for the Maatram Foundation. It balances institutional authority with a human-centered mission through an editorial lens.

The visual style is **Minimalist and Corporate**, heavily inspired by the precision of Linear and the elegance of Stripe. It prioritizes clarity and whitespace to evoke a sense of calm and competence. By utilizing high-quality typography and a restricted color palette, the UI communicates reliability and transparency to donors, partners, and beneficiaries alike. The mood is intentionally timeless, avoiding fleeting trends in favor of a lasting, professional presence.

## Colors
The palette is built on a foundation of "Onyx and Alabaster" to maintain high legibility and a classic editorial feel. 

- **Primary Text (#111827):** A deep charcoal used for body copy and headings, providing softer contrast than pure black.
- **Accent Luxury Gold (#D4AF37):** Reserved strictly for high-impact moments—primary call-to-actions, success indicators, and meaningful iconography. It serves as a visual beacon of quality and hope.
- **Neutrals:** Systematic use of `#F8F9FA` for secondary surfaces and `#E5E7EB` for structural hairlines creates a layered, organized environment without visual noise.

## Typography
Inter is the sole typeface, utilized for its exceptional readability and neutral, modern character. 

The system uses a tight scale for headings with negative letter-spacing to achieve an editorial "tightness" seen in premium publications. Body text is prioritized for legibility with generous line heights. Labels use a slightly heavier weight to maintain hierarchy at smaller scales. Use `display-lg` sparingly for hero sections to establish immediate brand authority.

## Layout & Spacing
This design system employs an **8px linear scale** to ensure mathematical harmony across all components.

- **Grid Model:** A 12-column fluid grid for desktop (max-width 1280px) with 24px gutters. For mobile, transition to a 4-column layout with 16px margins.
- **Rhythm:** Vertical spacing should follow the base units. Use `xxl` (48px) to separate distinct content sections and `md` (16px) for internal component padding.
- **Alignment:** All elements should snap to the 8px grid. Text should be left-aligned in most editorial contexts to maintain the professional, structured feel.

## Elevation & Depth
Depth is communicated through **Tonal Layering and Subtle Ambient Shadows**. 

The background is `#FFFFFF`, while "containers" (cards, modals) use the same background but are defined by a 1px border of `#E5E7EB`. 

Shadows are used only to denote interactivity or overlays:
- **Level 1 (Cards/Buttons):** A very soft, diffused shadow: `0 1px 3px 0 rgba(0, 0, 0, 0.05)`.
- **Level 2 (Modals/Popovers):** A more pronounced but still light shadow: `0 10px 15px -3px rgba(0, 0, 0, 0.05)`.

Avoid heavy drop shadows; rely on the secondary background color `#F8F9FA` to differentiate regions of the page.

## Shapes
The shape language is refined and consistent, moving away from aggressive sharp corners to appear more approachable.

- **Cards & Containers:** Fixed at **16px** radius to provide a distinct "framed" look for content.
- **Buttons & Inputs:** Fixed at **12px** radius to feel comfortable yet professional.
- **Small Elements (Chips/Tags):** Use a 6px radius or fully rounded pill-shape depending on context.

## Components
Consistent implementation across these elements ensures a premium feel:

- **Buttons:** 
  - *Primary:* Background `#D4AF37`, Text `#FFFFFF`, 12px radius. 
  - *Secondary:* Background `#FFFFFF`, Border `#E5E7EB`, Text `#111827`.
- **Input Fields:** 1px solid `#E5E7EB` border, 12px radius. Use `#F8F9FA` for the background on hover to indicate focus.
- **Cards:** 16px radius, 1px `#E5E7EB` border. No shadow by default; use a subtle shadow on hover for interactive cards.
- **Icons:** Use Lucide-style thin-stroke (1.5px or 2px weight) outline icons. Icons should primarily be `#6B7280`, switching to `#D4AF37` for active states or highlighted features.
- **Progress Indicators:** Use a thin, 4px height bar with `#D4AF37` to denote impact or funding goals.
- **Lists:** Clean rows with 1px bottom borders, using `#111827` for titles and `#6B7280` for metadata.