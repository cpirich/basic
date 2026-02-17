# MiniBasic

A BASIC interpreter written in TypeScript. Includes a Node.js CLI runner and a browser-based React playground.

## Language

MiniBasic supports a small BASIC dialect with numbered lines:

```basic
10 LET SECRET = INT(RND(1) * 100) + 1
20 PRINT "I'm thinking of a number between 1 and 100."
30 INPUT "Your guess"; G
40 IF G = SECRET THEN PRINT "Correct!" : GOTO 70
50 IF G < SECRET THEN PRINT "Too low!"
60 IF G > SECRET THEN PRINT "Too high!"
65 GOTO 30
70 END
```

**Statements:** LET, PRINT, IF/THEN/ELSE, GOTO, FOR/NEXT/STEP, GOSUB/RETURN, INPUT, END, REM

**Operators:** `+`, `-`, `*`, `/`, `MOD`, `=`, `<>`, `<`, `>`, `<=`, `>=`

**Types:** Numbers and strings (string variables end with `$`, e.g. `NAME$`)

**Built-in functions:** INT, RND, ABS, LEN, LEFT$, RIGHT$, MID$, STR$, VAL, CHR$, ASC

## Project Structure

npm workspaces monorepo with three packages:

```
packages/
  lang/          # Pure TS interpreter library (lexer, parser, evaluator)
  repl/          # Node.js CLI runner
  playground/    # React browser app
examples/        # .bas example programs
```

## Getting Started

```sh
npm install
npm run build
```

### Run a program in the CLI

```sh
npx tsx packages/repl/src/main.ts examples/fizzbuzz.bas
```

### Start the playground

```sh
npm run dev -w packages/playground
```

## Testing

```sh
npm test
```

## Architecture

The interpreter has three stages: **Lexer** (source -> tokens) -> **Parser** (tokens -> AST) -> **Evaluator** (AST -> execution).

The evaluator is an async generator that yields I/O events (`print`, `input`, `end`, `error`). The host environment (CLI or browser) drives execution by calling `.next(value)`. This keeps the interpreter platform-agnostic — the same library runs in Node.js and the browser with no duplication.
