# TODO

## Dron
  - 1- moved to the top of Dashboard

## Logs
- 1- huge files should be truncated or else they freeze app

## FileTree
- 1- Shows Folder Name
  - page renderMiddle(): fileFolder={getDashboardPath()}
  - FileTree: render it at the top
  - remove from FileViewer

## Git
  - pick Hermes OR Dashboard OR Dron (nothing else should change? SystemStatus)

## Tools CLEANUP
### SkillsToolLeft
- unused params
### HelpToolLeft
- unused params
### GitToolLeft
- Refactor?
- can Git-specific code move in to GitTool?  SystemStatus also uses git
- can `refreshGitStatus()` be replaced with `setGitStale()` = true?
