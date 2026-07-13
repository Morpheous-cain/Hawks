# Landing Motion Library

Tiny, branded animation primitives for the Black Hawk SOC-OS landing page.
Built on **framer-motion** (already in the bundle). Every primitive:

- respects `prefers-reduced-motion`
- animates **transform + opacity only** (no layout shift, no repaint)
- ships with sensible defaults so most usage is one prop or none

```tsx
import {
  FadeIn,
  StaggerGroup,
  StaggerItem,
  ScrollReveal,
  HoverLift,
  Parallax,
  GradientShift,
} from "@/components/landing/motion";
```

## When to use what

| Component        | Triggered by      | Use for                                              |
| ---------------- | ----------------- | ---------------------------------------------------- |
| `FadeIn`         | Mount             | Hero headline, above-the-fold copy, first CTA        |
| `StaggerGroup`   | Mount or viewport | Lists of cards, pillar grids, navigation rows        |
| `ScrollReveal`   | Viewport enter    | Mid-page sections, comparison tables, FAQ blocks     |
| `HoverLift`      | Pointer hover     | Buttons, CTA cards, clickable tiles                  |
| `Parallax`       | Scroll progress   | Decorative art, ambient orbs, hero imagery           |
| `GradientShift`  | Always (CSS)      | Backdrop behind CTAs, pricing, final call-to-action  |

## Props reference (defaults shown)

```tsx
<FadeIn direction="up" delay={0} duration={0.6} distance={24} />
<StaggerGroup stagger={0.08} delay={0} whileInView />
<ScrollReveal rootMargin="-80px" distance={32} duration={0.7} repeat={false} />
<HoverLift lift={-4} scale={1.015} tap={0.985} />
<Parallax offset={60} />
<GradientShift duration={18} />
```

## Examples

### Hero entrance, staggered

```tsx
<StaggerGroup whileInView={false} delay={0.1}>
  <StaggerItem><Eyebrow>Security Operations · v2026.1</Eyebrow></StaggerItem>
  <StaggerItem><h1>The operating system for modern security.</h1></StaggerItem>
  <StaggerItem><p className="text-muted-foreground">…</p></StaggerItem>
  <StaggerItem><Button>Request access</Button></StaggerItem>
</StaggerGroup>
```

### Scroll-revealed section heading

```tsx
<ScrollReveal>
  <Display>One console. Every operation.</Display>
</ScrollReveal>
```

### Interactive CTA card

```tsx
<HoverLift className="rounded-xl">
  <Card className="p-6">…</Card>
</HoverLift>
```

### Ambient backdrop behind a CTA

```tsx
<GradientShift className="rounded-2xl border border-border p-10">
  <h2>Take command of every shift.</h2>
</GradientShift>
```

## Performance guidance

- Use `FadeIn` sparingly — only above the fold. Below the fold prefer
  `ScrollReveal` so animations don't run for content the user can't see.
- `Parallax` subscribes to scroll; do not nest more than ~3 per page.
- `HoverLift` is keyboard-safe but is a no-op on touch devices, which is
  the desired behavior.
- All components no-op under `prefers-reduced-motion`, so accessibility
  testing is automatic.
- Bundle impact: 0 KB additional (framer-motion is already shipped for
  the field-app shell components).

## Extending to other pages

The primitives are page-agnostic. To use elsewhere:

1. Import from `@/components/landing/motion`.
2. Wrap your section with `ScrollReveal` for entry animation.
3. Wrap clickable cards with `HoverLift`.
4. Optional: drop a `GradientShift` behind a CTA panel.

That's it — no provider, no global config required.
