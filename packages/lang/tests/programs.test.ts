import { describe, it, expect } from "vitest";
import { compile, createInterpreter } from "../src/index.js";

async function runProgram(source: string, inputs: string[] = []): Promise<string[]> {
  const program = compile(source);
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

describe("integration: FizzBuzz", () => {
  it("prints correct FizzBuzz output for 1 to 20", async () => {
    const source = `
10 FOR I = 1 TO 20
20 IF I MOD 15 = 0 THEN GOTO 70
30 IF I MOD 3 = 0 THEN GOTO 80
40 IF I MOD 5 = 0 THEN GOTO 90
50 PRINT I
60 GOTO 100
70 PRINT "FIZZBUZZ"
75 GOTO 100
80 PRINT "FIZZ"
85 GOTO 100
90 PRINT "BUZZ"
95 GOTO 100
100 NEXT I
`;

    const output = await runProgram(source);

    expect(output[0]).toBe("1");
    expect(output[1]).toBe("2");
    expect(output[2]).toBe("FIZZ");
    expect(output[3]).toBe("4");
    expect(output[4]).toBe("BUZZ");
    expect(output[5]).toBe("FIZZ");
    expect(output[6]).toBe("7");
    expect(output[7]).toBe("8");
    expect(output[8]).toBe("FIZZ");
    expect(output[9]).toBe("BUZZ");
    expect(output[10]).toBe("11");
    expect(output[11]).toBe("FIZZ");
    expect(output[12]).toBe("13");
    expect(output[13]).toBe("14");
    expect(output[14]).toBe("FIZZBUZZ");
    expect(output[15]).toBe("16");
    expect(output[16]).toBe("17");
    expect(output[17]).toBe("FIZZ");
    expect(output[18]).toBe("19");
    expect(output[19]).toBe("BUZZ");
    expect(output).toHaveLength(20);
  });
});

describe("integration: Fibonacci", () => {
  it("prints first 10 fibonacci numbers", async () => {
    const source = `
10 INPUT "HOW MANY"; N
20 LET A = 0
30 LET B = 1
40 FOR I = 1 TO N
50 PRINT B
60 LET T = A + B
70 LET A = B
80 LET B = T
90 NEXT I
100 END
`;

    const output = await runProgram(source, ["10"]);
    expect(output).toEqual(["1", "1", "2", "3", "5", "8", "13", "21", "34", "55"]);
  });
});

describe("integration: Guessing Game", () => {
  it("responds to guesses correctly", async () => {
    // Use a fixed "random" number by assigning directly
    const source = `
10 LET N = 42
20 PRINT "GUESS THE NUMBER"
30 INPUT "YOUR GUESS"; G
40 IF G = N THEN GOTO 80
50 IF G < N THEN PRINT "TOO LOW"
60 IF G > N THEN PRINT "TOO HIGH"
70 GOTO 30
80 PRINT "CORRECT!"
90 END
`;

    const output = await runProgram(source, ["20", "60", "42"]);
    expect(output[0]).toBe("GUESS THE NUMBER");
    expect(output[1]).toBe("TOO LOW");
    expect(output[2]).toBe("TOO HIGH");
    expect(output[3]).toBe("CORRECT!");
  });
});
