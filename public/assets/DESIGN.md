---
name: High-Velocity Impact
colors:
  surface: '#131313'
  surface-dim: '#131313'
  surface-bright: '#393939'
  surface-container-lowest: '#0e0e0e'
  surface-container-low: '#1b1b1b'
  surface-container: '#1f1f1f'
  surface-container-high: '#2a2a2a'
  surface-container-highest: '#353535'
  on-surface: '#e2e2e2'
  on-surface-variant: '#e6bdbb'
  inverse-surface: '#e2e2e2'
  inverse-on-surface: '#303030'
  outline: '#ad8886'
  outline-variant: '#5d3f3e'
  surface-tint: '#ffb3b1'
  primary: '#ffb3b1'
  on-primary: '#680011'
  primary-container: '#e31837'
  on-primary-container: '#fffaf9'
  inverse-primary: '#bf0029'
  secondary: '#c6c6c7'
  on-secondary: '#2f3131'
  secondary-container: '#454747'
  on-secondary-container: '#b4b5b5'
  tertiary: '#c8c6c5'
  on-tertiary: '#313030'
  tertiary-container: '#747373'
  on-tertiary-container: '#fdfaf9'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffdad8'
  primary-fixed-dim: '#ffb3b1'
  on-primary-fixed: '#410007'
  on-primary-fixed-variant: '#92001d'
  secondary-fixed: '#e2e2e2'
  secondary-fixed-dim: '#c6c6c7'
  on-secondary-fixed: '#1a1c1c'
  on-secondary-fixed-variant: '#454747'
  tertiary-fixed: '#e5e2e1'
  tertiary-fixed-dim: '#c8c6c5'
  on-tertiary-fixed: '#1c1b1b'
  on-tertiary-fixed-variant: '#474746'
  background: '#131313'
  on-background: '#e2e2e2'
  surface-variant: '#353535'
typography:
  display-lg:
    fontFamily: Anton
    fontSize: 80px
    fontWeight: '400'
    lineHeight: '1.0'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Anton
    fontSize: 48px
    fontWeight: '400'
    lineHeight: '1.1'
    letterSpacing: 0.02em
  headline-lg-mobile:
    fontFamily: Anton
    fontSize: 32px
    fontWeight: '400'
    lineHeight: '1.1'
  headline-md:
    fontFamily: Anton
    fontSize: 24px
    fontWeight: '400'
    lineHeight: '1.2'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-bold:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '700'
    lineHeight: '1.0'
    letterSpacing: 0.1em
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.0'
spacing:
  unit: 4px
  container-max: 1280px
  gutter: 24px
  margin-desktop: 64px
  margin-mobile: 20px
  stack-xl: 80px
  stack-md: 32px
---

## Brand & Style
This design system is built on a foundation of **High-Contrast Boldness** and **Aggressive Minimalism**. It is designed to evoke a visceral, high-energy response—speed, heat, and uncompromising quality. The target audience is modern, decisive, and seeks premium, high-impact experiences.

The aesthetic avoids subtle gradients and soft shadows in favor of raw power. It draws inspiration from racing culture, editorial fashion, and high-end street branding. The goal is to create an environment where content feels urgent and every interaction feels like a definitive action.

## Colors
The palette is restricted to a triad of power: **Racing Red**, **Pure Black**, and **Crisp White**.

- **Primary (Racing Red):** Used exclusively for high-priority calls to action, active states, and critical brand moments. It represents energy and appetite.
- **Surface (Pure Black):** The primary canvas. Using true black (#000000) creates an infinite depth that allows the Red and White to pop with maximum intensity.
- **Text (White):** Used for all primary copy to ensure surgical legibility against the dark background.
- **Support (Deep Charcoal):** A secondary surface color (#1a1a1a) used sparingly for card backgrounds or dividers to provide subtle structural definition without breaking the high-contrast aesthetic.

## Typography
The typography is the primary engine of the brand's voice. 

- **Headlines:** Set in **Anton**. This font provides the "wall of text" impact required for this aesthetic. It must always be used in Uppercase. Tight leading is essential to maintain the dense, aggressive look.
- **Body:** Set in **Inter**. Its geometric neutrality balances the intensity of the headlines, ensuring long-form content remains readable.
- **Utility/Labels:** Set in **JetBrains Mono**. This adds a technical, precise edge to the design system, perfect for micro-copy, prices, or metadata.

## Layout & Spacing
The layout follows a **Fixed Grid** philosophy on desktop and a fluid, high-margin approach on mobile.

- **Grid:** A 12-column system with 24px gutters. Content should feel structured and architectural. 
- **Rhythm:** Spacing follows a 4px base unit. Use generous vertical spacing (80px+) between major sections to allow the high-contrast elements "room to breathe" and prevent visual clutter.
- **Alignment:** Elements should generally favor left-alignment to emphasize the "sturdy" feel of the Anton typeface. Avoid center-alignment for large blocks of text.

## Elevation & Depth
This design system rejects traditional shadows. Depth is created through **Tonal Layering** and **Sharp Contrast**:

- **Level 0 (Base):** Pure Black (#000000).
- **Level 1 (Surfaces):** Deep Charcoal (#1a1a1a). Used for cards or sectional backgrounds.
- **Level 2 (Interaction):** Racing Red (#e31837). Used for active elements.
- **Dividers:** Use 1px solid borders in #333333 (Dark Grey) or #e31837 (Red) for high-impact separation. No blurs or soft glows are permitted; all edges must be razor-sharp.

## Shapes
The shape language is **Sharp (0px)**. 

To maintain the aggressive and professional tone, all buttons, input fields, cards, and images must have 90-degree corners. Rounded corners are strictly prohibited as they soften the brand's visual impact. The only exception is for functional circular elements like radio buttons or toggles, though even those should seek a "boxy" container when possible.

## Components
- **Buttons:** Primary buttons are solid Racing Red with White Anton text. Hover states should invert to White background with Red text for a "flash" effect. Secondary buttons are White outlines with no fill.
- **Chips/Tags:** Small, rectangular boxes with JetBrains Mono text. Use Racing Red backgrounds for status alerts and Deep Charcoal for neutral categorization.
- **Input Fields:** Black background with a 1px White border. On focus, the border changes to Racing Red. Labels use JetBrains Mono in White.
- **Cards:** No shadows. Use a 1px solid border (#333333) or a slight color lift to #1a1a1a. Headers within cards should use Anton.
- **Lists:** Separated by 1px solid horizontal lines. Use the Racing Red for bullets or numbering to draw the eye.
- **Imagery:** High-contrast, desaturated, or "noir" style photography pairs best with this system. Use Racing Red color overlays for hero images to unify the brand.