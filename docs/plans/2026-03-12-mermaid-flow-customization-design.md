# Mermaid Flow Customization Design

**Date:** 2026-03-12

## Goal

Extend the current Mermaid Flow Studio preview experience without changing the existing edit-render-export workflow, adding configurable color themes, fixed and free layout modes, and four-direction flowchart orientation.

## Product Scope

- Preserve the current left-side chat workspace and `Render` trigger semantics
- Add color template selection that changes visual styling only
- Add `fixed` and `free` layout modes
- Add four supported directions:
  - vertical down
  - vertical up
  - horizontal right
  - horizontal left
- Persist customization state per opened Mermaid file
- Make free-layout edits survive export and app restart

## Architecture

The current `Mermaid -> SVG -> Preview -> Export` pipeline should remain intact, with a new presentation layer inserted between Mermaid rendering and preview/export consumption.

- `renderMermaid` continues to produce the base Mermaid SVG and dimensions
- A new presentation pipeline composes:
  - source text
  - selected palette
  - selected direction
  - layout mode
  - persisted free-layout node positions
- `PreviewPanel` renders the composed SVG rather than the raw Mermaid output
- Export uses the same composed SVG so preview and export stay identical
- Electron main process adds a lightweight file-scoped persistence store in the app user-data directory

## Interaction Model

The primary workflow remains unchanged:

1. User edits Mermaid source or opens a local file
2. User clicks `Render` or presses `Cmd + Enter`
3. The preview updates on the right
4. User zooms, fits, and exports from the preview area

New controls live in the preview toolbar so they do not interfere with the current editor flow.

- `Palette`: choose one of several designer-defined color templates
- `Layout`: switch between `Fixed` and `Free`
- `Direction`: choose `Down`, `Up`, `Right`, or `Left`

Defaults must match the current product behavior:

- default palette = current app palette
- default layout = `Fixed`
- default direction = `Down`

## Color Themes

Color templates should change only presentation, not graph structure or content.

- The base Mermaid theme remains `base`
- Each template maps to a consistent set of Mermaid theme variables and preview-surface colors
- Initial palette set should include 4-6 options, with the current palette retained as the default
- Palette changes should update both preview and export

## Orientation

Orientation should be implemented through controlled flowchart direction rewriting before Mermaid render.

- `Down` maps to `TD`
- `Up` maps to `BT`
- `Right` maps to `LR`
- `Left` maps to `RL`

Only the leading flowchart direction token should be rewritten so node and edge content remain untouched.

## Layout Modes

### Fixed Mode

Fixed mode matches the current behavior.

- Mermaid determines layout fully
- Users can zoom, fit, reset, and export
- No node dragging is available

### Free Mode

Free mode starts from the current Mermaid layout, then allows direct node repositioning.

- Users can drag individual nodes
- Node labels and shapes move together
- Connected edges and markers update live to match moved nodes
- Changes save immediately without requiring a separate save action

Switching behavior:

- `Fixed -> Free`: use the current Mermaid layout as the base
- `Free -> Fixed`: show the pure Mermaid auto-layout again
- Returning to `Free` restores the saved free-layout positions for the current file and direction

## Persistence Model

Customization state should be stored per Mermaid file path, not as a single global workspace snapshot.

- Opening a file must return both file contents and absolute file path
- The file path acts as the persistence key
- State is stored under Electron `app.getPath('userData')`
- A lightweight JSON-backed store is sufficient

Each stored record should include:

- `paletteId`
- `direction`
- `layoutMode`
- `layoutsByDirection`
- `lastSourceHash`
- `updatedAt`

`layoutsByDirection` stores free-layout data separately for each direction so vertical and horizontal layouts do not overwrite one another.

## Node Identity And Layout Reuse

Free-layout persistence must survive Mermaid source edits when unaffected nodes still exist.

- Persist layout by stable node key rather than Mermaid-generated SVG ids
- Primary key source: Mermaid node ids from the flowchart source, such as `A` in `A[Start]`
- On rerender:
  - if a stored node key still exists, reapply its saved position
  - if a node is new, use the Mermaid auto-layout position
  - if a node was removed, drop its persisted entry
- If a node label changes but its Mermaid node id remains the same, its position should persist

## Error Handling

- If Mermaid validation or render fails, keep the last successful preview visible
- Do not overwrite persisted free-layout data on a failed render
- If persisted customization data cannot be read, fall back to defaults and show a recoverable status message
- If some nodes cannot be matched during free-layout restoration, restore only the matched nodes and leave unmatched ones in Mermaid auto-layout positions

## Export Rules

- Export always uses the same composed SVG currently shown in preview
- In fixed mode, export reflects the selected palette and direction with Mermaid auto-layout
- In free mode, export reflects the dragged node positions and updated edges

## Testing Strategy

Testing should cover the new presentation layer and persistence behavior without regressing the current shell.

- Unit tests:
  - flowchart direction rewriting
  - palette application
  - file-state persistence read/write
  - layout merge behavior for source changes
- Component tests:
  - toolbar control defaults
  - mode switching
  - direction switching
  - palette switching
- E2E tests:
  - open file and restore saved customization
  - drag nodes in free mode, restart, and verify restoration
  - export output reflects current free-layout state

## Acceptance Criteria

- Existing render and export flow remains intact for users who do not touch the new controls
- Users can switch among multiple color templates without changing diagram content
- Users can switch between fixed and free modes
- In free mode, node moves persist into exported images
- The app restores palette, direction, and free-layout positions for the same Mermaid file after restart
- If Mermaid source changes, persisted positions are reapplied for unchanged node ids
- Users can render the same chart in four directions: down, up, right, and left
