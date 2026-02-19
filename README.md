# Crossfire

Orchestrate multi-LLM debates across ChatGPT, Gemini, and Claude. Compare perspectives on the same question, cross-examine models against each other's responses, and let them rank contributions.

## Features

- **Multi-Model Debate** — Send the same question to multiple AI models simultaneously and compare their responses side-by-side.
- **Cross-Examination** — Feed each model's response to the others, enabling genuine multi-perspective debate across rounds.
- **Peer Ranking** — Have each participant evaluate and rank all other models' contributions, with aggregated scoring.
- **Custom Roles** — Define custom personas with system prompts so each model argues from a specific viewpoint.
- **Manual & Auto Mode** — Step through rounds manually or let the debate progress automatically.
- **Session Management** — Start fresh conversations or continue within existing sessions.
- **No API Keys Required** — Works entirely through the browser tabs you're already logged into.

## Supported Providers

| Provider | URL |
|----------|-----|
| ChatGPT | chatgpt.com |
| Gemini | gemini.google.com |
| Claude | claude.ai |

## Installation

### From Source

```bash
pnpm install
pnpm build
```

1. Open `chrome://extensions` in Chrome.
2. Enable **Developer mode**.
3. Click **Load unpacked** and select the `dist/` folder.

### Requirements

- Chrome 114+
- Logged in to at least one of the supported AI provider sites.

## Usage

1. Click the Crossfire icon in the toolbar to open the side panel.
2. Go to **Settings** to configure your models (name, provider, system prompt).
3. Select which models to include in the debate.
4. Type a question and hit **Send**.
5. Once all models respond, use **Cross** to start cross-examination rounds.
6. Use **Rank** to let models evaluate each other's contributions.

## Development

```bash
pnpm install
pnpm dev       # Build with watch mode
```

The `dev` script runs Vite in watch mode — reload the extension in `chrome://extensions` after changes.

## Tech Stack

- **UI**: React 19, Zustand
- **Build**: Vite, @crxjs/vite-plugin
- **Language**: TypeScript
- **Platform**: Chrome Extension Manifest V3 (Side Panel API)

## Project Structure

```
src/
├── background/     # Service worker — tab management, debate orchestration
├── content/        # Content scripts & provider adapters (ChatGPT, Gemini, Claude)
├── shared/         # Shared types and message definitions
├── sidepanel/      # React UI (pages, components, stores)
├── icons/          # Extension icons (SVG source + PNG exports)
└── manifest.json
```

## License

ISC
