# Hermes Control Configuration

## Overview

Hermes Control now supports being run as a separate repository while still accessing your Hermes folder's data and resources.

## Configuring the Hermes Path

### Quick Start

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Edit `.env.local` and set the `HERMES_PATH` to your Hermes folder:

   **macOS/Linux:**
   ```
   HERMES_PATH=/Users/username/.hermes
   ```
   or with tilde expansion:
   ```
   HERMES_PATH=~/.hermes
   ```

   **Windows:**
   ```
   HERMES_PATH=C:\Users\username\.hermes
   ```
   or:
   ```
   HERMES_PATH=C:\Hermes
   ```

3. Restart the development server:
   ```bash
   npm run dev
   ```

### Environment Variables

- **`HERMES_PATH`** (optional)
  - Full path to your Hermes folder
  - Supports tilde (`~`) expansion on Unix-like systems
  - If not set, falls back to relative path resolution (for running from `tools/mc` within Hermes)

### Path Resolution Priority

The app resolves the Hermes path in this order:

1. **`HERMES_PATH` environment variable** - If set, use this exact path
2. **Relative path fallback** - Navigate up two directories from the app's location (assumes running from `tools/mc`)

### What Gets Configured

Once `HERMES_PATH` is set, all of these paths are automatically resolved relative to it:

- `sessions` - Session files
- `cron` - Cron job configuration and runs
- `logs` - Logs
- `memories` - Memories
- `skills` - Skills
- `.env` - The Hermes environment file (for API keys, etc.)

## Notes

- `.env.local` is **not committed to git** (see `.gitignore`) - it's local to your machine
- The `.env.example` file shows the format and can be shared in the repository
- Path expansion with `~` is supported for home directories on Unix-like systems
- Windows paths should use forward slashes (`/`) or backslashes (`\`), both are supported
