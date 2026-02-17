# Claude Code — Project Notes

## Project Overview

MiniBasic — a BASIC interpreter in TypeScript. npm workspaces monorepo with three packages:

- `packages/lang` — Pure TS interpreter library (lexer, parser, async generator evaluator). Zero runtime deps.
- `packages/repl` — Node.js CLI runner. Uses `readline/promises` for INPUT.
- `packages/playground` — React + Vite browser app. Code editor + output console.
- `examples/` — Shared `.bas` example programs.

The evaluator is an async generator yielding I/O events. Host environments drive it via `.next(value)`.

### Key Commands

- `npm install` — Install all workspace dependencies
- `npm test` — Run vitest across all packages
- `npm run build` — Build all packages
- `npx tsx packages/repl/src/main.ts examples/fizzbuzz.bas` — Run a program in CLI
- `npm run dev -w packages/playground` — Start the playground dev server

## Plans

Project plans and design documents are stored in the `plans/` directory. Plan files must have meaningful, descriptive filenames (e.g., `machine-specific-format-filtering.md`, not auto-generated names). Commit plan files alongside the code they describe so we can look back later to see what was done.

## Testing

**IMPORTANT: Always run tests before committing changes.**

If type checking or tests fail, fix the issues before committing. Do not skip or disable tests without a clear reason and TODO comment explaining why.

## Git Commands

Run git commands without `-C` or absolute paths — the working directory is already the project root. Use plain `git status`, `git diff`, `git log`, etc. to match the allow list patterns (e.g., `git status:*`). Using `git -C /full/path` won't match and will trigger unnecessary permission prompts.

## GitHub CLI

Due to sandbox proxy configuration, you need to use the `-R owner/repo` flag when using `gh` commands.
