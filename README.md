# Hermes Control (HC)

Hermes Control is the central management dashboard for the Hermes agent. It provides a visual, real-time interface to inspect system activity, manage files, monitor cron jobs, and review session history.

## Architecture
- **Framework:** [Next.js](https://nextjs.org/docs) (App Router)
- **UI:** [React](https://react.dev/) + [Tailwind CSS](https://tailwindcss.com/docs)
- **Type Safety:** [TypeScript](https://www.typescriptlang.org/docs/)
- **State Management:** React local state (shared via props through the application shell in `app/page.tsx`).

## Core Layout
The interface employs a three-column dashboard pattern:
1. **Sidebar (Left):** Global navigation, system health status, and active tool selection.
2. **Tool List (Middle):** Dynamic navigation/filtering for the selected tool.
3. **Detail View (Right):** Primary workspace for file editing, markdown rendering, and log inspection.

## Key Features
- **Thermal Activity Layers:** Real-time color-coding based on file modification timestamps.
- **Log Management:** Deep inspection of session `.jsonl` files with search, filtering, and "Load All" capabilities.
- **Agent Integration:** Direct interaction with Hermes commands, jobs, and file systems via local API Route Handlers (`app/api/`).
- **Interactive Git/Cmd:** Integrated Git status and command-line execution.

## Getting Started

1. **Environment Setup:**
   Copy `.env.example` to `.env.local` and configure your Hermes path:
   ```bash
   HERMES_PATH=~/.hermes
   ```

2. **Installation:**
   ```bash
   npm install
   ```

3. **Launch:**
   Use the helper script in the root directory:
   ```bash
   ./mc.sh
   ```
   *Dashboard runs on port 3000.*

## Development Guide
- **UI Shell:** `app/page.tsx`
- **Tool Components:** `app/components/tools/`
- **Backend API:** `app/api/`

---
*Built as a durable, custom operational view for the Hermes agent.*
