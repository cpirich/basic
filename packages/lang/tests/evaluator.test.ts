import { describe, it, expect } from "vitest";
import { lex } from "../src/lexer.js";
import { parse } from "../src/parser.js";
import { createInterpreter } from "../src/evaluator.js";
import { RuntimeError } from "../src/errors.js";

async function runProgram(
  source: string,
  inputs: string[] = [],
): Promise<string[]> {
  const program = parse(lex(source));
  const interp = createInterpreter(program);
  const output: string[] = [];
  let inputIndex = 0;
  let result = await interp.next();
  while (!result.done) {
    const event = result.value;
    if (event.type === "print") {
      output.push(event.text);
    } else if (event.type === "input") {
      result = await interp.next(inputs[inputIndex++]);
      continue;
    } else if (event.type === "error") {
      throw event.error;
    } else if (event.type === "end") {
      break;
    }
    result = await interp.next();
  }
  return output;
}

describe("evaluator", () => {
  it("LET and PRINT", async () => {
    const out = await runProgram("10 LET X = 5\n20 PRINT X");
    expect(out).toEqual(["5"]);
  });

  it("arithmetic expressions", async () => {
    const out = await runProgram("10 PRINT 2 + 3 * 4");
    expect(out).toEqual(["14"]);
  });

  it("string variables", async () => {
    const out = await runProgram('10 LET A$ = "HI"\n20 PRINT A$');
    expect(out).toEqual(["HI"]);
  });

  it("string concatenation", async () => {
    const out = await runProgram('10 PRINT "A" + "B"');
    expect(out).toEqual(["AB"]);
  });

  it("IF/THEN true branch", async () => {
    const out = await runProgram(
      '10 LET X = 1\n20 IF X = 1 THEN PRINT "YES"',
    );
    expect(out).toEqual(["YES"]);
  });

  it("IF/THEN false branch (no output)", async () => {
    const out = await runProgram(
      '10 LET X = 2\n20 IF X = 1 THEN PRINT "YES"',
    );
    expect(out).toEqual([]);
  });

  it("IF/THEN/ELSE", async () => {
    const out = await runProgram(
      '10 LET X = 2\n20 IF X = 1 THEN PRINT "YES" ELSE PRINT "NO"',
    );
    expect(out).toEqual(["NO"]);
  });

  it("GOTO loop", async () => {
    const out = await runProgram(
      "10 LET X = 0\n20 LET X = X + 1\n30 IF X < 3 THEN GOTO 20\n40 PRINT X",
    );
    expect(out).toEqual(["3"]);
  });

  it("FOR/NEXT loop", async () => {
    const out = await runProgram(
      "10 FOR I = 1 TO 3\n20 PRINT I\n30 NEXT I",
    );
    expect(out).toEqual(["1", "2", "3"]);
  });

  it("FOR/NEXT with STEP", async () => {
    const out = await runProgram(
      "10 FOR I = 2 TO 6 STEP 2\n20 PRINT I\n30 NEXT I",
    );
    expect(out).toEqual(["2", "4", "6"]);
  });

  it("FOR/NEXT with negative STEP", async () => {
    const out = await runProgram(
      "10 FOR I = 3 TO 1 STEP -1\n20 PRINT I\n30 NEXT I",
    );
    expect(out).toEqual(["3", "2", "1"]);
  });

  it("GOSUB/RETURN", async () => {
    const out = await runProgram(
      '10 GOSUB 100\n20 PRINT "BACK"\n30 END\n100 PRINT "SUB"\n110 RETURN',
    );
    expect(out).toEqual(["SUB", "BACK"]);
  });

  it("INPUT with canned values", async () => {
    const out = await runProgram(
      '10 INPUT "NAME: "; N$\n20 PRINT "HELLO " + N$',
      ["WORLD"],
    );
    expect(out).toEqual(["HELLO WORLD"]);
  });

  it("INPUT numeric", async () => {
    const out = await runProgram(
      "10 INPUT X\n20 PRINT X * 2",
      ["5"],
    );
    expect(out).toEqual(["10"]);
  });

  it("built-in INT", async () => {
    const out = await runProgram("10 PRINT INT(3.7)");
    expect(out).toEqual(["3"]);
  });

  it("built-in ABS", async () => {
    const out = await runProgram("10 PRINT ABS(-5)");
    expect(out).toEqual(["5"]);
  });

  it("built-in LEN", async () => {
    const out = await runProgram('10 PRINT LEN("HELLO")');
    expect(out).toEqual(["5"]);
  });

  it("built-in LEFT$", async () => {
    const out = await runProgram('10 PRINT LEFT$("HELLO", 2)');
    expect(out).toEqual(["HE"]);
  });

  it("built-in RIGHT$", async () => {
    const out = await runProgram('10 PRINT RIGHT$("HELLO", 2)');
    expect(out).toEqual(["LO"]);
  });

  it("built-in MID$", async () => {
    const out = await runProgram('10 PRINT MID$("HELLO", 2, 3)');
    expect(out).toEqual(["ELL"]);
  });

  it("built-in STR$ and VAL", async () => {
    const out = await runProgram(
      '10 LET A$ = STR$(42)\n20 PRINT VAL(A$) + 1',
    );
    expect(out).toEqual(["43"]);
  });

  it("built-in CHR$ and ASC", async () => {
    const out = await runProgram(
      '10 PRINT CHR$(65)\n20 PRINT ASC("A")',
    );
    expect(out).toEqual(["A", "65"]);
  });

  it("PRINT with semicolons joins items", async () => {
    const out = await runProgram('10 PRINT "A"; "B"; "C"');
    expect(out).toEqual(["ABC"]);
  });

  it("uninitialized numeric variable defaults to 0", async () => {
    const out = await runProgram("10 PRINT X");
    expect(out).toEqual(["0"]);
  });

  it("uninitialized string variable defaults to empty", async () => {
    const out = await runProgram("10 PRINT X$");
    expect(out).toEqual([""]);
  });

  it("runtime error for type mismatch", async () => {
    await expect(runProgram('10 PRINT "A" - 1')).rejects.toThrow(RuntimeError);
  });

  it("MOD operator", async () => {
    const out = await runProgram("10 PRINT 10 MOD 3");
    expect(out).toEqual(["1"]);
  });

  it("comparison returns -1 for true", async () => {
    const out = await runProgram("10 PRINT 1 = 1");
    expect(out).toEqual(["-1"]);
  });

  it("comparison returns 0 for false", async () => {
    const out = await runProgram("10 PRINT 1 = 2");
    expect(out).toEqual(["0"]);
  });

  it("END stops execution", async () => {
    const out = await runProgram(
      '10 PRINT "A"\n20 END\n30 PRINT "B"',
    );
    expect(out).toEqual(["A"]);
  });

  it("multiple statements on one line", async () => {
    const out = await runProgram("10 LET X = 5 : PRINT X");
    expect(out).toEqual(["5"]);
  });

  it("nested FOR loops", async () => {
    const out = await runProgram(
      "10 FOR I = 1 TO 2\n20 FOR J = 1 TO 2\n30 PRINT I * 10 + J\n40 NEXT J\n50 NEXT I",
    );
    expect(out).toEqual(["11", "12", "21", "22"]);
  });
});
