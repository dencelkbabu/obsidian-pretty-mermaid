# Changelog

All notable changes to the Pretty Mermaid plugin will be documented in this file.

## [2.0.0] - 2026-09-25

### Features
- **UI & Controls**: Added floating glass diagram toolbar with export (PNG/SVG markup) and interactive zoom/pan controls (`1b67cff`).
- **Directives**: Supported per-diagram inline directive overrides (`%% theme: catppuccin %%`, `%% mode: dark %%`, `%% zoom: true %%`) (`71b6322`).
- **Themes & Palettes**: Added curated modern theme presets (`adaptive`, `catppuccin`, `tokyo-night`, `nord`, `minimalist`, `classic`, `monochrome`) and dynamic light/dark palette engines (`298ac18`, `b68c1cf`, `c4f7d7d`, `0680b1a`).
- **Customization & Events**: Added flowchart curve smoothing settings, color mode configuration, and automatic workspace `css-change` event handling (`04ba37a`, `7d544c8`, `3780caf`).
- **Styling Modernization**: Modernized node geometry, smooth corner radii, card elevation, and typography across all Mermaid diagram types (`8e19f6d`).

### Bug Fixes
- **Edge Labels & Clipping**: Prevented SVG `foreignObject` clipping on edge labels (fixing "Yes"/"No" pill truncation), eliminated background cutouts, and improved text contrast (`5aedbab`, `85747a8`, `3856e83`, `5446b62`).
- **Pie Charts**: Solved dark/light mode text contrast and inversion filter issues on pie chart titles, slices, and legends (`0fe16c9`, `fff1395`, `6a9d56b`, `149c1b7`).
- **Theme Contrast**: Ensured resilient dark mode text rendering and high-contrast text across all themes (`c95b73e`, `72d9ba4`).
