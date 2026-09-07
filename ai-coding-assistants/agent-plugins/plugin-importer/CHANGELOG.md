# Changelog

## 1.1.0

- Flat-list `hooks.json` variants (`{"hooks": [{"event": ...}]}`) are now accepted alongside the
  nested form, without renaming event names — they carry over unchanged.
- Skills-only installs no longer silently drop everything when a folder name collides with an
  already-installed skill of a different plugin — if nothing could be copied, the report says so and
  suggests `--as power`.
- Symlinked files inside a plugin are copied by content, not re-linked — a relative symlink pointing
  outside the plugin directory (common in marketplaces with shared files) no longer breaks after the
  copy.
- A skill that references a sibling folder without a `SKILL.md` (shared assets, not itself a skill) now
  has that folder copied alongside it in skills-only installs.
- `${CLAUDE_PLUGIN_ROOT}` substitutions that point into an intermediate staging directory are
  redirected to the permanent asset path when that directory is removed after a skills-only install,
  instead of being left dangling.

## 1.0.0

First release.

- `scan` lists plugins installed through Claude Code or Codex, with each one's components and a
  recommended destination. `--from` reads a marketplace or plugin repository instead, following
  entries that point at another git repository.
- `port` converts and installs. Skill-bearing plugins go to `~/.kiro/skills/` with their hooks and
  agents alongside, so slash commands and hooks both keep working; plugins with `commands/` or MCP
  servers become Powers. `--as skills` / `--as power` override, `--project-local` writes into the
  current project, `--out` generates without installing.
- `unport` removes everything an import installed and leaves the original plugin untouched.
- Bodies are copied byte-for-byte and checked after the copy. The only substitution is
  `${CLAUDE_PLUGIN_ROOT}` → the installed path.
- Hooks are rewritten to Kiro's `v1` schema with tool matchers mapped. Fields Kiro has no equivalent
  for — `if`, `timeout`, `asyncRewake` — are reported rather than dropped silently, and `shell` is
  honoured by wrapping the command.
- `keywords` are derived from plugin and skill names only; anything beyond that is recommended in the
  report and never written without asking.
