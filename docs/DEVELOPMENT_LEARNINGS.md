# Development Learnings & Technical Reference

This document summarizes key root causes, edge cases, and design patterns discovered during the development and maintenance of `obsidian-pretty-mermaid`.

---

## 1. Dark Mode Theme Inversion Filter (The "Double-Flip" Effect)

### Root Cause
Obsidian achieves dark mode styling on dynamically rendered Mermaid diagrams by applying a CSS filter (`filter: invert(1) hue-rotate(180deg)`) to SVG blocks. 

### Gotcha
Attempting to fix dark mode text visibility by setting `fill: #ffffff` or `fill: var(--text-normal)` causes the SVG text to be caught in the theme inversion filter and forcefully flipped back to near-black (`#070503`).

### CSS Selector Index & Mapping

| CSS Selector | Diagram Type | Target Element |
| :--- | :--- | :--- |
| `.pieTitleText` | Pie Chart | Main chart title |
| `.slice` | Pie Chart | Slice percentage & label text |
| `.legend text` | Pie Chart / Charts | Legend items & labels |
| `.messageText` | Sequence Diagram | Description text above message arrows |
| `.loopText` | Sequence Diagram | Header text for `loop`, `alt`, and `opt` blocks |
| `.labelText` | Sequence Diagram | Text inside sequence label boxes |
| `.sequenceNumber` | Sequence Diagram | Numbers inside step sequence circles (`1`, `2`, `3`...) |
| `.noteText` | Sequence Diagram | Text inside sequence note boxes (`Note over X...`) |
| `rect.note` / `.note` | Sequence Diagram | Note box background card & border |
| `.chart-title text` | XYChart (`xychart-beta`) | Main chart title |
| `.bottom-axis text` | XYChart (`xychart-beta`) | X-axis title and tick number labels |
| `.left-axis text` | XYChart (`xychart-beta`) | Y-axis title and tick number labels |
| `.right-axis text` / `.top-axis text` | XYChart (`xychart-beta`) | Secondary axes titles & tick labels |
| `.bottom-axis path` / `.left-axis path` | XYChart (`xychart-beta`) | Axis lines & tick stroke lines |

### Working Solution

Counter-invert dark mode text by explicitly supplying black (`#000000`) fill in dark mode (so the filter flips it to clean white), while supplying direct dark fill (`#1e293b`) in light mode:

```css
/* --------------------------------------------------------------------------
   DARK MODE — feed #000000 to the inversion filter so it outputs white text
   -------------------------------------------------------------------------- */
body.theme-dark svg[id] .pieTitleText,      /* Pie chart: main title */
body.theme-dark svg[id] .slice,             /* Pie chart: slice percentage text */
body.theme-dark svg[id] .legend text,       /* Pie/Charts: legend text */
body.theme-dark svg[id] .messageText,       /* Sequence diagram: message arrow text */
body.theme-dark svg[id] .loopText,          /* Sequence diagram: loop/alt header text */
body.theme-dark svg[id] .labelText,         /* Sequence diagram: label text */
body.theme-dark svg[id] .sequenceNumber,    /* Sequence diagram: step circle numbers */
body.theme-dark svg[id] .chart-title text,  /* XYChart: main chart title */
body.theme-dark svg[id] .bottom-axis text,   /* XYChart: X-axis labels & title */
body.theme-dark svg[id] .left-axis text,     /* XYChart: Y-axis labels & title */
body.theme-dark svg[id] .right-axis text,    /* XYChart: Right Y-axis labels */
body.theme-dark svg[id] .top-axis text {     /* XYChart: Top X-axis labels */
  fill: #000000 !important;
  color: #000000 !important;
}

body.theme-dark svg[id] .bottom-axis path,  /* XYChart: X-axis line & tick marks */
body.theme-dark svg[id] .left-axis path,    /* XYChart: Y-axis line & tick marks */
body.theme-dark svg[id] .right-axis path,   /* XYChart: Right Y-axis line */
body.theme-dark svg[id] .top-axis path {    /* XYChart: Top X-axis line */
  stroke: #000000 !important;
}

/* --------------------------------------------------------------------------
   LIGHT MODE — no inversion, provide dark text directly
   -------------------------------------------------------------------------- */
body.theme-light svg[id] .pieTitleText,
body.theme-light svg[id] .slice,
body.theme-light svg[id] .legend text,
body.theme-light svg[id] .messageText,
body.theme-light svg[id] .loopText,
body.theme-light svg[id] .labelText,
body.theme-light svg[id] .sequenceNumber,
body.theme-light svg[id] .chart-title text,
body.theme-light svg[id] .bottom-axis text,
body.theme-light svg[id] .left-axis text,
body.theme-light svg[id] .right-axis text,
body.theme-light svg[id] .top-axis text {
  fill: #1e293b !important;
  color: #1e293b !important;
}

body.theme-light svg[id] .bottom-axis path,
body.theme-light svg[id] .left-axis path,
body.theme-light svg[id] .right-axis path,
body.theme-light svg[id] .top-axis path {
  stroke: #64748b !important;
}
```

---

## 2. SVG `<foreignObject>` Clipping on Edge Labels & Nodes

### Root Cause
Mermaid's layout calculation generates fixed `width` and `height` pixel attributes on `<foreignObject>` SVG elements based on unstyled raw text dimensions. When CSS enhances edge labels with background pills, padding (`padding: 3px 10px`), or borders, the element size exceeds the specified bounding box. Default SVG overflow clipping truncates the edges (e.g. clipping "Yes" -> "Ye" and "No" -> "N").

### Working Solution
Enforce `overflow: visible !important` across all `foreignObject` containers and their child wrapper `div`s:

```css
.pretty-mermaid-enhanced foreignObject,
.pretty-mermaid-enhanced .node foreignObject,
.pretty-mermaid-enhanced .edgeLabel foreignObject,
.pretty-mermaid-enhanced .edgeLabel foreignObject > div,
.pretty-mermaid-enhanced .edgeLabel .labelBkg {
  overflow: visible !important;
}
```

---

## 3. Subgraph Layout Orientation (`mermaid.live` vs Obsidian)

### Root Cause
Obsidian core compiles and renders Mermaid SVGs using an embedded renderer before plugin post-processors run. The layout engine (Dagre) calculates graph rank orientation based on offscreen element bounding box aspect ratios:
- In `mermaid.live`, a narrow editor preview pane forces node text to wrap onto 3-4 lines, making nodes tall (`height > width`) and triggering vertical `TD` rank layout.
- In Obsidian, unconstrained text measurement renders single-line wide nodes (`width >> height`), prompting Dagre to auto-orient unconnected subgraphs horizontally (`LR`).

### Working Solution
Always explicitly declare `direction TD` inside each `subgraph` block in the Mermaid code when vertical orientation is desired:

```mermaid
flowchart TD
    subgraph P1["Section 1"]
        direction TD
        A --> B --> C
    end
```

---

## 4. Obsidian Plugin Release Guidelines

1. **Required Release Assets**: Every GitHub release must attach:
   - `main.js` (compiled JavaScript bundle)
   - `manifest.json` (plugin manifest)
   - `styles.css` (custom stylesheet)
2. **Version Matching**: Tag names on GitHub must match the `"version"` string in `manifest.json` exactly (e.g. `2.0.0`).
3. **`versions.json` Mapping**: Maintain `"pluginVersion": "minAppVersion"` mappings in `versions.json`:
   ```json
   {
     "1.0.0": "0.15.0",
     "2.0.0": "0.15.0"
   }
   ```
