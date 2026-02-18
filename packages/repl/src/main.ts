import { readFile } from "node:fs/promises";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { compile, createInterpreter } from "minibasic-lang";

async function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error("Usage: minibasic-repl <file.bas>");
    process.exit(1);
  }

  const source = await readFile(filePath, "utf-8");
  const program = compile(source);
  const interp = createInterpreter(program);

  const rl = createInterface({ input: stdin, output: stdout });

  try {
    let result = await interp.next();
    while (!result.done) {
      const event = result.value;
      switch (event.type) {
        case "print":
          console.log(event.text);
          break;
        case "input": {
          const answer = await rl.question(event.prompt);
          result = await interp.next(answer);
          continue;
        }
        case "error":
          console.error(`Runtime error at line ${event.error.line}: ${event.error.message}`);
          process.exit(1);
          break;
        case "end":
          rl.close();
          return;
      }
      result = await interp.next();
    }
  } finally {
    rl.close();
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
