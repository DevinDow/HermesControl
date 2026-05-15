# TODO

## Logs
- 1- huge files should be truncated or else they freeze app

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
