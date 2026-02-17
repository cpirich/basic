# Claude Code — Project Notes

## Project Overview

## Plans

Project plans and design documents are stored in the `plans/` directory. Plan files must have meaningful, descriptive filenames (e.g., `machine-specific-format-filtering.md`, not auto-generated names). Commit plan files alongside the code they describe so we can look back later to see what was done.

## Testing

**IMPORTANT: Always run tests before committing changes.**

If type checking or tests fail, fix the issues before committing. Do not skip or disable tests without a clear reason and TODO comment explaining why.

## Git Commands

Run git commands without `-C` or absolute paths — the working directory is already the project root. Use plain `git status`, `git diff`, `git log`, etc. to match the allow list patterns (e.g., `git status:*`). Using `git -C /full/path` won't match and will trigger unnecessary permission prompts.

## GitHub CLI

Due to sandbox proxy configuration, you need to use the `-R owner/repo` flag when using `gh` commands.
