# MiniBasic Interpreter

## Context

Build a BASIC interpreter in TypeScript as a learning/fun project. The repo is nearly bare — just `CLAUDE.md` and `.claude/settings.json`. The interpreter ships in two phases: a pure TS library with Node REPL, then a browser-based React playground that shares the same interpreter library.

## Architecture

**npm workspaces monorepo** with three packages:

```
packages/
  lang/          # Pure TS interpreter library (zero runtime deps)
  repl/          # Node.js CLI runner (depends on lang)
  playground/    # React browser app (depends on lang)
examples/        # .bas files shared by repl and playground
```

**Evaluator is an async generator** — the key architectural decision. It `yield`s I/O events (`print`, `input`, `end`, `error`) and the host environment (REPL or browser) drives it via `.next(value)`. This keeps the interpreter platform-agnostic and solves the INPUT problem cleanly for both Node (readline) and browser (Promise-based suspension).

## Language Features

- **Statements**: LET, PRINT, IF/THEN/ELSE, GOTO, FOR/NEXT/STEP, GOSUB/RETURN, INPUT, END, REM
- **Operators**: `+`, `-`, `*`, `/`, `MOD`, `=`, `<>`, `<`, `>`, `<=`, `>=`
- **Types**: Numbers and strings (string variables end with `$`)
- **Built-ins**: INT, RND, ABS, LEN, LEFT$, RIGHT$, MID$, STR$, VAL, CHR$, ASC
- **Syntax**: Numbered lines (`10 PRINT "HELLO"`), colon as statement separator, case-insensitive

## Phase 1: Core Library + REPL

### Step 1: Project scaffolding
- Root `package.json` with `"workspaces": ["packages/*"]`
- `tsconfig.base.json` (ES2022, strict, ESM)
- Each package gets its own `package.json` and `tsconfig.json`
- Install: `typescript`, `vitest`, `tsx`

### Step 2: Tokens and errors
- `packages/lang/src/tokens.ts` — TokenType enum (NUMBER, STRING, IDENTIFIER, STRING_IDENT, all keywords, operators, delimiters, EOF) + Token interface with line/column
- `packages/lang/src/errors.ts` — `LexError`, `ParseError`, `RuntimeError` extending a base `MiniBasicError`, all carrying line numbers for helpful messages

### Step 3: Lexer + tests
- `packages/lang/src/lexer.ts` — `lex(source: string): Token[]`
- Case-insensitive keywords (uppercased internally), string literals in double quotes, `$`-suffixed identifiers, REM consumes to EOL, colon as separator
- `packages/lang/tests/lexer.test.ts`

### Step 4: AST types
- `packages/lang/src/ast.ts` — Discriminated unions: `Program` > `ProgramLine[]` > `Statement[]`
- Statement types: Let, Print, If, Goto, For, Next, Gosub, Return, Input, End, Rem
- Expression types: NumberLiteral, StringLiteral, Variable, BinaryExpression, UnaryExpression, FunctionCall
- Every statement carries `sourceLine` for error reporting

### Step 5: Parser + tests
- `packages/lang/src/parser.ts` — `parse(tokens: Token[]): Program`
- Recursive descent with precedence: comparison < addition < multiplication < unary < primary
- Lines must start with a line number; multiple statements per line via `:`
- `packages/lang/tests/parser.test.ts`

### Step 6: Evaluator + built-ins + tests
- `packages/lang/src/evaluator.ts` — `createInterpreter(program: Program): AsyncGenerator<InterpreterEvent, void, string | undefined>`
- I/O protocol: yields `{ type: "print", text }`, `{ type: "input", prompt }`, `{ type: "end" }`, `{ type: "error", error }`
- Internal state: variables map, FOR stack, GOSUB stack, line index + statement index, lineNumber-to-index lookup map
- GOTO/GOSUB: set lineIndex via lookup map. RETURN: pop from gosubStack. FOR/NEXT: push/pop forStack with limit/step/return-address
- `packages/lang/src/builtins.ts` — INT, RND, ABS, LEN, LEFT$, RIGHT$, MID$, STR$, VAL, CHR$, ASC
- `packages/lang/tests/evaluator.test.ts`

### Step 7: Public API + integration tests
- `packages/lang/src/index.ts` — Exports lex, parse, createInterpreter, compile (convenience: lex+parse), types, errors
- `packages/lang/tests/programs.test.ts` — Run full .bas programs, collect output, verify correctness
- Test helper: `runProgram(source, inputs[])` drives the generator with canned INPUT responses

### Step 8: Example programs
- `examples/fizzbuzz.bas` — FOR 1 TO 100, MOD checks
- `examples/guess.bas` — RND, INPUT loop, comparison
- `examples/fibonacci.bas` — INPUT N, FOR loop computing sequence

### Step 9: Node.js REPL
- `packages/repl/src/main.ts` — Reads a .bas file from CLI args, compiles, drives the generator using `readline/promises` for INPUT
- Run via `npx tsx packages/repl/src/main.ts examples/fizzbuzz.bas`

## Phase 2: React Playground

### Step 10: Vite + React scaffold
- `packages/playground/` — `vite.config.ts` (with `@vitejs/plugin-react`), `index.html`, `src/main.tsx`
- Dependencies: `react`, `react-dom`, `vite`, `@vitejs/plugin-react`

### Step 11: Components
- `App.tsx` — Two-pane layout: editor left, console right, toolbar top
- `Editor.tsx` — `<textarea>` with monospace font (simple, zero deps; can upgrade to CodeMirror later)
- `Console.tsx` — Displays output lines; when INPUT is pending, shows an input field at the bottom
- `Toolbar.tsx` — Run/Stop button, example program dropdown

### Step 12: useInterpreter hook
- Drives the async generator from React state
- `run(source)`: compiles, iterates events, appends print output to state
- INPUT handling: `await new Promise(resolve => { ref.current = resolve })` suspends the async loop; `submitInput(value)` resolves it
- `stop()`: calls `generator.return()` to cancel

### Step 13: Example dropdown
- Import .bas files as raw strings via Vite `?raw`
- `examples/index.ts` — Array of `{ name, source }` objects
- Dropdown selection loads source into editor

### Step 14: Polish
- Stop button cancels running programs
- Error output styled distinctly (red)
- Responsive two-pane layout

## Verification

1. **Unit tests**: `npm test` from root runs vitest across all packages — lexer, parser, evaluator
2. **Integration tests**: programs.test.ts runs FizzBuzz (check output lines), Fibonacci (with canned input "10", verify sequence), guessing game (with scripted guesses)
3. **REPL manual test**: `npx tsx packages/repl/src/main.ts examples/guess.bas` — play the guessing game interactively
4. **Playground manual test**: `npm run dev -w packages/playground` — load each example from dropdown, click Run, verify output, test INPUT interaction
5. **Type checking**: `npx tsc --noEmit` in each package
