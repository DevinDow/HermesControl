# TODO

- Scripts is using "Tree" structure.  Shoud it not, or should others?  Which need tree? System.

## Dashboard 

## Scripts
- ScriptstoolLeft PLAY doesn't populate Cmd Tool

## page.tsx
- understand each Section
- extract parts to Components?

## Memory
- Tree for MemoryToolLeft

## Jobs
- Play Button to trigger Job
- `hermes cron edit --schedule ""` to save schedule changes that update "next_run_at"

## Sessions
- 1- refresh polling - see MC page 606 api/sessions/timestamp 2s
- sort by File Modified DateTime, display File Modified DateTime
- Should it use `hermes sessions list` or /sessions?
- .jsonl?

## Git
- see MC page 576 api/git/pulse 2s

## Logs
- long lines
  - expandable like Sessions?
  - limit to 25 lines so can scroll horizontally?
  - or just use Trackpad?
