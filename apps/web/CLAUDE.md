# CLAUDE.md — BrokerClaw Web Frontend

## Overview
Landing page and trading interface for the BrokerClaw OTC protocol.

## Stack
- SvelteKit 2 with static adapter (no SSR)
- Svelte 5 with runes syntax (`$state`, `$derived`, `$props`, `$effect`)
- Tailwind CSS 3 with custom retro neon theme
- viem for blockchain interactions
- TypeScript strict

## Theme — Retro Neon Synthwave
- **Base colors:** Deep purple (`#0d0221` → `#3d1d6e`)
- **Accent:** Neon pink `#ff2a6d`, cyan `#05d9e8`, orange `#ff6e27`, green `#01ff89`
- **Fonts:** Orbitron (display/headings), Rajdhani (body), JetBrains Mono (mono)
- **Effects:** Neon glow on text/borders/buttons, grid background, scanlines, floating animation
- **CSS classes:** `.glow-text`, `.glow-text-cyan`, `.neon-border`, `.neon-border-pink`, `.neon-hr`, `.scanlines`
- **Buttons:** `.btn-primary` (pink→orange gradient), `.btn-secondary` (cyan outline), `.btn-outline` (pink outline)

## Structure
```
src/
  app.css                    → Global styles, Tailwind layers, neon components
  app.html                   → HTML shell with font imports
  routes/
    +layout.svelte           → Header + Footer wrapper
    +page.svelte             → Homepage (hero + stats + offers + RFQs + deals)
    offers/+page.svelte      → Offers marketplace
    rfq/+page.svelte         → RFQ listing
    deals/+page.svelte       → Deal history
    leaderboard/+page.svelte → Reputation leaderboard
  lib/
    components/              → UI components (Header, Footer, Cards, Forms, etc.)
    contracts/               → ABI + addresses + config (mirrors Solidity contracts)
    stores/                  → Svelte stores (wallet, stats, offers)
    utils/                   → Constants, formatters
```

## Commands
```bash
pnpm dev      # Dev server
pnpm build    # Static build
pnpm check    # Type checking (svelte-check)
```

## Conventions
- Svelte 5 runes only — `let { x } = $props()`, NOT `export let x`
- All headings/labels: `font-display uppercase tracking-wider`
- Cards use glassmorphism: `bg-base-800/80 backdrop-blur`
- Keep the neon-but-readable balance — glows are subtle, not blinding
- Static assets in `static/` (brokerclaw.jpg mascot image)
