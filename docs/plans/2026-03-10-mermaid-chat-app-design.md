# Mermaid Chat App Design

**Date:** 2026-03-10

## Goal

Build a macOS desktop application that opens locally, can be distributed to other Mac users as an unsigned app, parses Mermaid `flowchart` syntax, renders it as a polished node graph, and exports images as `PNG` or `JPG` in low, medium, and high resolutions.

## Product Scope

- Desktop platform: macOS
- App shell: Electron
- UI shape: chatbot-inspired layout with a persistent preview canvas
- Mermaid support in v1: `flowchart` only
- Rendering mode: local/offline by default
- Export formats: `PNG`, `JPG`
- Export quality presets: low (`1x`), medium (`2x`), high (`3x`)
- Distribution target: local `.app` packaged in `.dmg`, unsigned

## Architecture

The application will use `Electron + React + Vite + TypeScript`.

- `Electron main` owns window creation, native dialogs, filesystem access, export save paths, and packaged app behavior.
- `React renderer` owns the chatbot interface, Mermaid source input, validation, SVG rendering, zoom controls, and export controls.
- Mermaid parsing and rendering happen locally in the renderer so the app works offline and does not send diagram content to a server.

## Layout

The app will use a two-column layout rather than a developer-style split editor.

- Top bar:
  - App title
  - `New`
  - `Open`
  - `Export`
- Left column:
  - Chat-style conversation stream
  - User message card containing Mermaid input
  - Assistant/system result card describing render state
  - Errors shown as compact status cards
- Right column:
  - Large preview canvas for the latest successfully rendered diagram
  - Zoom controls
  - Fit-to-view behavior
  - Stable margins so large charts do not feel cramped
- Bottom composer:
  - Mermaid input textarea
  - `Render` action
  - Example insertion action
  - Shortcut support for `Cmd + Enter`

## Visual Direction

The interface should feel like a native macOS productivity app rather than a generic engineering tool.

- Warm light background palette
- Graphite text colors
- Teal accent color for actions and active states
- Rounded cards with soft shadows
- Spacious padding and balanced whitespace
- Clear separation between chat history and preview canvas

## Interaction Model

The app will use "preview while editing, render on command" semantics.

1. User pastes Mermaid `flowchart` source or opens a local `.mmd`/`.txt` file.
2. Input receives lightweight checks for emptiness and unsupported diagram type.
3. User presses `Render` or `Cmd + Enter`.
4. Mermaid renders locally to `SVG`.
5. On success:
   - The status card updates to a successful render state.
   - The right canvas shows the latest rendered diagram.
6. On failure:
   - An error card explains the issue.
   - The last successful diagram remains visible.

## Rendering Rules

- Only `flowchart` diagrams are supported in v1.
- Unsupported Mermaid types should produce a clear product-level error message.
- The preview should render as `SVG` for crisp scaling.
- The canvas should support:
  - zoom in
  - zoom out
  - reset to 100%
  - fit to view
- Very large diagrams should scale to fit without distortion and remain scrollable.

## Export Design

Exports operate on the latest successful render.

- Formats:
  - `PNG`
  - `JPG`
- Quality presets:
  - low = `1x`
  - medium = `2x`
  - high = `3x`
- Export behavior:
  - Rendered `SVG` is converted locally into a bitmap at the selected scale.
  - `PNG` supports transparent or light background output.
  - `JPG` always uses a light background.
  - Safe padding is applied to prevent text clipping.
  - Default filename format: `mermaid-export-YYYYMMDD-HHmmss`

## Error Handling

The app should prioritize recovery and avoid losing the last good render.

- Empty input: prompt user to add Mermaid content
- Unsupported diagram type: explain that v1 supports `flowchart` only
- Mermaid syntax failure: show Mermaid error details in a user-friendly card
- Render exception: report failure and preserve the last successful output
- Export without a rendered graph: disable export or show a direct prompt

## Packaging

The app will be packaged for macOS distribution as an unsigned application.

- Output artifacts:
  - `.app`
  - `.dmg`
- First-run experience may require users to right-click and choose `Open`
- Apple signing and notarization are out of scope for v1

## Acceptance Criteria

- App launches locally on macOS
- Default sample chart renders on first open
- The provided Mermaid `flowchart` example renders correctly
- Invalid Mermaid input shows an error without clearing the previous good preview
- `PNG` and `JPG` exports succeed
- Low/medium/high exports are visibly different in resolution
- Large diagrams preserve aspect ratio and remain viewable
- Packaged app opens on another Mac through the unsigned app flow
