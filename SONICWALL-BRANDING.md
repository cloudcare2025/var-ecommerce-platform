# SonicWall Visual Branding & Design System

A complete reference of SonicWall's visual identity as implemented on sonicwall.com. Every value documented here is extracted from the live site, official brand assets (Brandfolder/Brandfetch), and the SonicWall Brand Guide.

---

## 1. Color Palette

### Primary Blue System
| Token | Hex | Usage |
|-------|-----|-------|
| **SonicWall Blue** | `#0075DB` | Primary brand color, CTAs, links, active states |
| **Light Blue** | `#8DC1FC` | Accents, eyebrow labels on dark backgrounds |
| **Malibu Blue** | `#74B3F6` | Alternative light accent (Brandfetch) |
| **Prussian Blue** | `#001B50` | Dark theme variant, deep backgrounds |
| **Soft Blue Start** | `#BDDBFA` | Product card gradient start |
| **Soft Blue End** | `#EFF9FC` | Product card gradient end |

### Orange Accent System
| Token | Hex | Usage |
|-------|-----|-------|
| **Orange** | `#F36E44` | Badges, alerts, gradient start |
| **Orange Light** | `#FB9668` | Gradient end |
| **Brand Orange** | `#FF5D00` | Official accent (Brandfolder) |

### Dark System
| Token | Hex | Usage |
|-------|-----|-------|
| **Foreground** | `#020817` | Primary text, dark button fills |
| **SonicWall Dark** | `#1F2929` | Footer background, dark sections |

### Neutrals
| Token | Hex | Usage |
|-------|-----|-------|
| **White** | `#FFFFFF` | Backgrounds, text on dark |
| **Gray (bg)** | `#F5F5F3` | Alternating section backgrounds |
| **Gray (border)** | `#E2E8F0` | Borders, dividers, card outlines |
| **Dove Gray** | `#666666` | Secondary body text |

### Utility
| Token | Hex | Usage |
|-------|-----|-------|
| **Green** | `#22C55E` | Success states, "Included" pricing |

---

## 2. Gradients

### Blue Ribbon (Promo Bar)
```css
background: linear-gradient(90deg, #0075DB, #8DC1FC);
```

### Blue Soft (Product Card Backgrounds)
```css
background: linear-gradient(90deg, #BDDBFA, #EFF9FC);
```

### Orange (Badges, Highlights)
```css
background: linear-gradient(90deg, #F36E44, #FB9668);
```

### Hero Overlay (Left-heavy Darken)
```css
background: linear-gradient(to right, rgba(2,8,23,0.8), rgba(2,8,23,0.4));
```

### Feature Card Overlay (Bottom-heavy)
```css
background: linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.3) 50%, transparent 100%);
```

### Stats Section Overlay
```css
background: rgba(2,8,23,0.85); /* over full-bleed background image */
```

### Testimonial Overlay
```css
background: rgba(2,8,23,0.75);
```

---

## 3. Typography

### Font Families
| Role | Family | Fallback Stack | Source |
|------|--------|---------------|--------|
| **Headings** | DIN Next LT Pro | Barlow*, ui-sans-serif, system-ui, sans-serif | Custom / Google* |
| **Body** | Aktiv Grotesk | Inter*, ui-sans-serif, system-ui, sans-serif | Custom / Google* |

*\*Google Font alternatives used when custom fonts are WAF-blocked.*

### Type Scale

| Element | Size | Weight | Line Height | Letter Spacing | Color |
|---------|------|--------|-------------|---------------|-------|
| **Hero H1** | 56px / 72px (desktop) | 300 (Light) | 1.05 | normal | White |
| **Section H2** | 42px | 300 (Light) | tight | normal | `#020817` |
| **Card H3** | 24-32px | 300-400 | tight | normal | White or `#020817` |
| **Product Title** | 20px | 400 | normal | normal | `#020817` |
| **Stat Number** | 48px | 300 (Light) | 1 | normal | `#0075DB` |
| **Eyebrow Label** | 11px | 700 (Bold) | normal | 0.15em | `#0075DB` or `#8DC1FC` |
| **Body** | 14-16px | 400 | 1.625 (relaxed) | normal | `#020817` |
| **Body Large** | 18-20px | 400 | 1.625 | normal | White/80% |
| **Small** | 13px | 400-600 | normal | normal | Gray variants |
| **Micro** | 11px | 700 (labels) / 400 | normal | 0.1em | `#0075DB` or gray |
| **Price** | 20-24px | 700 (Bold) | 1 | normal | `#1F2929` |
| **Quote** | 20px / 24px (desktop) | 300 | relaxed | normal | White |

### Eyebrow Pattern (Used Everywhere)
```css
font-size: 11px;
font-weight: 700;
letter-spacing: 0.15em;
text-transform: uppercase;
color: #0075DB; /* or #8DC1FC on dark backgrounds */
margin-bottom: 8px;
```

### Font Smoothing
```css
-webkit-font-smoothing: antialiased;
-moz-osx-font-smoothing: grayscale;
```

---

## 4. Buttons

### Primary CTA
```
Background: #0075DB
Text: White, 15px, Bold
Padding: 14px 32px
Border-radius: 8px
Hover: #0066c0
Icon: ArrowRight (16px) trailing
Transition: background-color 150ms
```

### Secondary / Ghost (Dark Backgrounds)
```
Background: rgba(255,255,255,0.1)
Backdrop-filter: blur(4px)
Border: 1px solid rgba(255,255,255,0.3)
Text: White, 15px, Bold
Padding: 14px 32px
Border-radius: 8px
Hover: rgba(255,255,255,0.2)
```

### Dark Button (Header CTA)
```
Background: #020817
Text: White, 14px, Semi-bold (600)
Padding: 10px 20px
Border-radius: 8px
Hover: #333333
```

### Add to Cart
```
Background: #0075DB
Text: White, 13px, Bold
Padding: 10px 16px
Border-radius: 8px
Icon: ShoppingCart (16px) leading
Gap: 8px
Hover: #0066c0
```

### Link CTA (Inline)
```
Color: #0075DB
Font-weight: Bold
Font-size: 14px
Icon: ArrowRight (16px) trailing
Hover: gap increases from 8px to 12px (forward-motion effect)
```

---

## 5. Card Patterns

### Product Card
```
Background: White
Border: 1px solid #E2E8F0
Border-radius: 8px
Overflow: hidden
Hover: translateY(-4px), shadow-xl
Transition: all 300ms ease

Image area:
  Background: gradient-blue-soft
  Min-height: 220px
  Padding: 32px
  Product image: object-contain, max-height 160px
  Hover: scale 105%

Badge (absolute top-right):
  Background: gradient-orange
  Text: White, 11px, bold
  Padding: 4px 12px
  Border-radius: 9999px (pill)

Body:
  Padding: 20px
  Flex column, flex-1

Footer:
  Border-top: 1px solid #E2E8F0
  Padding-top: 16px
  Flex: space-between
```

### Feature Card (Image Overlay)
```
Border-radius: 16px
Min-height: 360px
Overflow: hidden
Image: object-cover, scale 105% on hover (500ms)
Gradient overlay: linear-gradient(to top, rgba(0,0,0,0.8), rgba(0,0,0,0.3), transparent)
Content: positioned bottom, padding 32px
```

### Category Showcase Card
```
Border-radius: 16px
Min-height: 280px
Flex: items-end
Image: object-cover, scale 105% on hover (500ms)
Overlay: linear-gradient(to top, rgba(2,8,23,0.8), rgba(2,8,23,0.3), transparent)
Content: padding 32px, width 100%
"Shop Now" link with ArrowRight, gap increases on hover
```

### Stats Card
```
Background: rgba(255,255,255,0.05)
Backdrop-filter: blur(4px)
Border: 1px solid rgba(255,255,255,0.1)
Border-radius: 12px
Padding: 32px
Text-align: center
```

### Testimonial Card
```
Border-radius: 16px
Min-height: 320px
Background image with rgba(2,8,23,0.75) overlay
Content: centered, padding 48px
Quote icon: 48px, opacity 60%
Pagination dots: 10px circles, #0075DB active / #E2E8F0 inactive
Nav buttons: 40px circles, border #E2E8F0
```

---

## 6. Layout System

### Container
```
Max-width: 1200px
Padding: 0 24px
Margin: 0 auto
```

### Section Spacing
```
Standard sections: padding 80px 0
Hero sections: padding 96px 0
Sub-sections (utility bars): padding 6-10px 0
```

### Grid Patterns
```
Products (4-col):  grid-cols-1 → sm:2 → lg:4, gap 24px
Features (3-col):  grid-cols-1 → md:3, gap 24px
Categories (2-col): grid-cols-1 → md:2, gap 24px
Footer (4-col):    grid-cols-1 → md:2 → lg:4, gap 40px
Content (2-col):   grid-cols-1 → lg:2, gap 48px
```

### Breakpoints (Tailwind)
```
sm:  640px
md:  768px
lg:  1024px
xl:  1280px
```

---

## 7. Navigation

### Promo Bar (Top)
```
Background: gradient-blue-ribbon
Text: White, 14px
Padding: 10px 16px
Content: "SONICWALL STORE | Shop enterprise cybersecurity solutions..."
```

### Utility Bar
```
Background: White
Border-bottom: 1px solid #E2E8F0
Padding: 6px 0
Font: 13px
Links: hover #0075DB
Right side: "Need help?" + "Contact Sales" link (#0075DB, bold)
```

### Main Header
```
Background: White
Position: sticky top-0 z-50
Border-bottom: 1px solid #E2E8F0
Shadow: sm
Height: 64px
Logo: 147x24px SVG
CTA button: "Get a Quote" (dark style, top-right)
Mobile toggle: lg breakpoint (1024px)
```

### Mega Menu
```
Position: absolute, centered below trigger
Background: White
Border: 1px solid #E2E8F0
Border-radius: 8px
Shadow: xl
Padding: 24px
Min-width: 680px
Grid: 3 columns, gap 24px
Animation: opacity 0→1, translateY(-8px)→0, 200ms

Group header: 11px, bold, uppercase, tracking 0.15em, #0075DB
Link: 14px, #1F2929, hover #0075DB, padding 6px 0
```

### Cart Badge
```
Background: #F36E44
Size: 18px circle
Position: absolute -2px -2px
Text: White, 10px, bold
```

---

## 8. Imagery Style

### Product Photography
- **Background:** Soft blue gradient (`#BDDBFA` to `#EFF9FC`)
- **Treatment:** Clean, white-isolated products centered on gradient
- **Size:** `object-contain`, max-height 160-180px
- **Padding:** 32px around product
- **No drop shadows** on product images (gradient provides depth)
- **Hover:** Scale 105% (300ms)

### Hero Photography
- Full-bleed, `object-cover`
- Left-heavy dark gradient overlay (80% → 40%)
- High-quality cybersecurity/tech imagery
- Priority loading (above fold)
- Wave SVG divider at bottom edge

### Section Background Images
- Always paired with dark overlay (75-85% opacity)
- `object-cover` for full fill
- Cyber/tech imagery (data centers, networks, abstract)
- White text guaranteed readable via overlay

### Icon Style (Lucide React)
- **Style:** Outline/stroke (not filled)
- **Stroke width:** 2px (default)
- **Sizes:** 14px (small), 16px (standard), 20px (medium), 24px (large)
- **Color:** Inherited from parent text color
- **Common icons:** ArrowRight, ShoppingCart, Search, Menu, X, ChevronDown, ChevronLeft, ChevronRight, Shield, Check, Plus, Minus, Send, Phone, Mail, MapPin, SlidersHorizontal

### Logo
- **Format:** SVG (primary), PNG (white variant for footer)
- **Dimensions:** 147px wide x 24px tall
- **Styles:** Dark (on light backgrounds), White (on dark backgrounds)
- **Wordmark:** "SONICWALL" with integrated wave element

---

## 9. Background Alternation Pattern

The homepage follows a strict light/dark rhythm to create visual breathing room:

```
1. Hero          → Dark (image + overlay)
2. Trust Bar     → White (with bottom border)
3. Features      → White
4. Products      → White
5. Stats         → Dark (image + 85% overlay)
6. Categories    → Light Gray (#F5F5F3)
7. Testimonials  → White
8. Partners      → White
9. News          → Light Gray (#F5F5F3)
10. Footer CTA   → Dark (image + overlay)
11. Footer       → Dark (#1F2929)
```

**Rule:** Never stack two identical backgrounds. Dark sections always use a background image with overlay, not flat color (except footer grid).

---

## 10. Distinctive Visual Elements

### Wave Divider (Hero Bottom)
```svg
<svg viewBox="0 0 1440 120">
  <path d="M0 64L60 58.7C120 53 240 43 360 48C480 53 600 75 720 80
           C840 85 960 75 1080 64C1200 53 1320 43 1380 37.3L1440 32
           V120H0V64Z" fill="white"/>
</svg>
```
- Height: 120px
- Position: absolute bottom, z-10
- Purpose: Smooth organic transition from hero to white section

### Eyebrow + Heading Pattern
Every section follows this structure:
```
[EYEBROW LABEL]   — 11px, bold, uppercase, tracking 0.15em, #0075DB
[Main Heading]     — 42px, weight 300, #020817
[Optional subtext] — 18px, gray, max-width constrained
```

### Feature Checkmarks
```
✓ Feature text here
```
- Checkmark: Unicode `✓` (10003)
- Color: `#0075DB`
- Gap: 6px
- Feature text: 12px, `text-gray-500`

### Price Display Pattern
```
"Starting at" — 11px, text-gray-400
$X,XXX.XX     — 20-24px, font-heading, bold, #1F2929
```
Or for free/included:
```
"Included" — font-heading, 18px, bold, #22C55E
```

### Badge Taxonomy
| Badge | Background | Text | Meaning |
|-------|-----------|------|---------|
| "New" | gradient-orange | White, 11px bold | New product |
| "Per User/Mo" | gradient-orange | White, 11px bold | Subscription pricing |
| "Per Endpoint/Mo" | gradient-orange | White, 11px bold | Per-seat pricing |
| "Included" | gradient-orange | White, 11px bold | Free with purchase |

---

## 11. Animation & Motion

### Card Hover
```css
transform: translateY(-4px);
box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1);
transition: all 300ms ease;
```

### Image Hover (Inside Cards)
```css
transform: scale(1.05);
transition: transform 500ms ease;
```

### Button Hover
```css
background-color: [darker shade];
transition: background-color 150ms ease;
```

### Entrance Animations
```css
/* Fade In Up (content appearance) */
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(24px); }
  to { opacity: 1; transform: translateY(0); }
}
/* Duration: 600ms, ease-out */

/* Slide In Right (toasts, sidebar) */
@keyframes slideInRight {
  from { opacity: 0; transform: translateX(40px); }
  to { opacity: 1; transform: translateX(0); }
}
/* Duration: 300-500ms, ease-out */

/* Scale Up (stats numbers) */
@keyframes countUp {
  from { opacity: 0; transform: scale(0.8); }
  to { opacity: 1; transform: scale(1); }
}
```

### Mega Menu
```css
/* Open: */ opacity: 1; visibility: visible; transform: translateY(0);
/* Closed: */ opacity: 0; visibility: hidden; transform: translateY(-8px);
transition: all 200ms ease;
```

### Link Arrow Animation
```css
/* Resting: */ gap: 8px;
/* Hover: */   gap: 12px;
transition: gap 300ms ease;
/* Creates a "forward motion" micro-interaction */
```

### Smooth Scroll
```css
html { scroll-behavior: smooth; }
```

---

## 12. Border & Shadow System

### Border Radius Scale
| Size | Value | Usage |
|------|-------|-------|
| **sm** | 8px (`rounded-lg`) | Buttons, inputs, dropdowns |
| **md** | 12px (`rounded-xl`) | Stats cards, spec tables |
| **lg** | 16px (`rounded-2xl`) | Feature cards, testimonials, showcases |
| **full** | 9999px (`rounded-full`) | Badges, avatar circles, dots |

### Border Colors
| Context | Value |
|---------|-------|
| Light backgrounds | `#E2E8F0` (1px solid) |
| Dark backgrounds | `rgba(255,255,255,0.1)` to `rgba(255,255,255,0.3)` |
| Footer divider | `rgba(255,255,255,0.15)` |

### Shadow Levels
| Level | Usage |
|-------|-------|
| `shadow-sm` | Header (subtle) |
| `shadow-xl` | Cards on hover, mega menu |
| `shadow-2xl` | Cart sidebar |

---

## 13. Footer

### CTA Band (Top of Footer)
```
Background: Dark image with overlay
Padding: 64px 0
Text-align: center
Heading: 42px, weight 300, white
Subtext: 18px, white/80%
Button: White bg, dark text, bold, 8px radius
```

### Footer Grid
```
Background: #1F2929
Padding: 48px 0
Grid: 4 columns (responsive)
Gap: 40px

Section headers: 11px, bold, uppercase, tracking 0.15em, white/40%
Links: 14px, white/70%, hover white, padding 4px 0
```

### Social Icons
```
Size: 32px circles
Border: 1px solid white/30%
Text: First letter, 12px, white/60%
Hover: bg #0075DB, border #0075DB, text white
```

### Footer Bottom
```
Border-top: 1px solid white/15%
Margin-top: 40px
Padding-top: 24px
Text: 13px, white/50%
Layout: flex, space-between
```

---

## 14. Brand Voice & Design Philosophy

### Visual Identity Principles
- **Trust-first:** Deep blues convey security and reliability
- **Clarity over decoration:** Every element earns its place
- **Outcome-focused:** Design serves conversion, not aesthetics
- **Tech-forward:** Gradients, glass effects, smooth motion
- **Premium accessibility:** High contrast, readable sizes, clean layouts

### Historical Campaign Reference: "Fear Less"
- SonicWall's 2017 campaign used creature-based visuals (lion, octopus, bulldog) formed from network cabling and smoke
- Tagline: "Innovate More. Fear Less."
- Counter-positioned against industry's "dark hacker" aesthetics
- Emphasized empowerment over fear

### Color Psychology
| Color | Emotion | Usage |
|-------|---------|-------|
| Blue | Trust, security, stability | Primary brand, CTAs |
| Orange | Urgency, energy, action | Badges, alerts, accents |
| Dark | Authority, sophistication | Text, premium sections |
| White | Clarity, space, simplicity | Backgrounds, breathing room |

---

## Sources

- [SonicWall.com](https://www.sonicwall.com) — Live website analysis
- [SonicWall Brand Assets (Brandfetch)](https://brandfetch.com/sonicwall.com)
- [SonicWall Digital Library (Brandfolder)](https://brandfolder.com/sonicwall)
- [SonicWall Brand Guide 3.27.17 (Scribd)](https://www.scribd.com/document/370010996/SonicWall-Brand-Guide-3-27-17)
- [SonicWall Campaign Design (Frances Yllana)](https://www.francesyllana.design/work/sonicwall)
