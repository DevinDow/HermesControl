# TODO

* merge ScriptsTool to use File Tools?

## FileTree
- 1- Shows Folder Name
  - page renderMiddle(): fileFolder={getDashboardPath()}
  - FileTree: render it at the top
  - *** or can it be done in page Middle???

## Sessions
- display File Modified DateTime
- Should it use `hermes sessions list` or something else?
- .jsonl?

## Scripts
- ScriptsToolLeft PLAY doesn't populate Cmd Tool

## Memory
- Tree for MemoryToolLeft

## Logs
- long lines
  - expandable like Sessions?
  - limit to 25 lines so can scroll horizontally?
  - or just use Trackpad?

## Tools CLEANUP
### SkillsToolLeft
- unused params
### HelpToolLeft
- unused params
### GitToolLeft
- Refactor?
- can Git-specific code move in to GitTool?  SystemStatus also uses git
- can `refreshGitStatus()` be replaced with `setGitStale()` = true?

