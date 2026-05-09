# TODO

## HTML
- HTML viewer
  - weather_spec.md has both Markdown & HTML

## FileTree
- Shows Folder Name

## Code Tool
- so can read/edit HermesControl code

## Sessions
- 1- scroll Session contents while keeping Title at the top
- 1- Refresh Left should spin until complete
- display File Modified DateTime
- Should it use `hermes sessions list` or something else?
- .jsonl?

## Middle
- 1-first improve Sessions Refresh (layout, spinner)
- Refresh - pass in a function for Refresh then add a button that calls it

## Scripts
- ScriptsToolLeft PLAY doesn't populate Cmd Tool

## Memory
- Tree for MemoryToolLeft

## Jobs
- Play Button to trigger Job `hermes cron run job_id`
- `hermes cron edit --schedule "" job_id` to save schedule changes that update "next_run_at"
- `hermes cron pause/resume job_id`

## Logs
- long lines
  - expandable like Sessions?
  - limit to 25 lines so can scroll horizontally?
  - or just use Trackpad?
