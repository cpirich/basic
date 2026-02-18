import { describe, it, expect } from "vitest";
import { lex } from "../src/lexer.js";
import { parse } from "../src/parser.js";
import { ParseError } from "../src/errors.js";
import type {
  Program,
  LetStatement,
  PrintStatement,
  IfStatement,
  GotoStatement,
  ForStatement,
  NextStatement,
  GosubStatement,
  ReturnStatement,
  InputStatement,
  EndStatement,
  RemStatement,
  BinaryExpression,
  NumberLiteral,
  StringLiteral,
  Variable,
  FunctionCall,
  UnaryExpression,
} from "../src/ast.js";

function parseProgram(source: string): Program {
  return parse(lex(source));
}

function firstStatement(source: string) {
  const program = parseProgram(source);
  return program.lines[0].statements[0];
}

describe("parser", () => {
  describe("LET statement", () => {
    it("parses simple LET", () => {
      const stmt = firstStatement("10 LET X = 5") as LetStatement;
      expect(stmt.type).toBe("let");
      expect(stmt.variable).toBe("X");
      expect((stmt.value as NumberLiteral).type).toBe("number");
      expect((stmt.value as NumberLiteral).value).toBe(5);
    });

    it("parses implicit LET (no keyword)", () => {
      const stmt = firstStatement("10 X = 5") as LetStatement;
      expect(stmt.type).toBe("let");
      expect(stmt.variable).toBe("X");
      expect((stmt.value as NumberLiteral).value).toBe(5);
    });

    it("parses LET with string variable", () => {
      const stmt = firstStatement('10 LET N$ = "HELLO"') as LetStatement;
      expect(stmt.type).toBe("let");
      expect(stmt.variable).toBe("N$");
      expect((stmt.value as StringLiteral).type).toBe("string");
      expect((stmt.value as StringLiteral).value).toBe("HELLO");
    });
  });

  describe("PRINT statement", () => {
    it("parses PRINT with single expression", () => {
      const stmt = firstStatement('10 PRINT "HELLO"') as PrintStatement;
      expect(stmt.type).toBe("print");
      expect(stmt.items).toHaveLength(1);
      expect((stmt.items[0] as StringLiteral).value).toBe("HELLO");
    });

    it("parses PRINT with semicolons", () => {
      const stmt = firstStatement('10 PRINT "A"; "B"') as PrintStatement;
      expect(stmt.type).toBe("print");
      expect(stmt.items).toHaveLength(3);
      expect((stmt.items[0] as StringLiteral).value).toBe("A");
      expect(stmt.items[1]).toBe(";");
      expect((stmt.items[2] as StringLiteral).value).toBe("B");
    });

    it("parses PRINT with no arguments", () => {
      const stmt = firstStatement("10 PRINT") as PrintStatement;
      expect(stmt.type).toBe("print");
      expect(stmt.items).toHaveLength(0);
    });
  });

  describe("IF statement", () => {
    it("parses IF/THEN", () => {
      const stmt = firstStatement(
        '10 IF X = 1 THEN PRINT "YES"',
      ) as IfStatement;
      expect(stmt.type).toBe("if");
      expect((stmt.condition as BinaryExpression).operator).toBe("=");
      expect(stmt.thenBranch).toHaveLength(1);
      expect(stmt.thenBranch[0].type).toBe("print");
      expect(stmt.elseBranch).toBeUndefined();
    });

    it("parses IF/THEN/ELSE", () => {
      const stmt = firstStatement(
        '10 IF X = 1 THEN PRINT "YES" ELSE PRINT "NO"',
      ) as IfStatement;
      expect(stmt.type).toBe("if");
      expect(stmt.thenBranch).toHaveLength(1);
      expect(stmt.thenBranch[0].type).toBe("print");
      expect(stmt.elseBranch).toHaveLength(1);
      expect(stmt.elseBranch![0].type).toBe("print");
    });
  });

  describe("GOTO statement", () => {
    it("parses GOTO", () => {
      const stmt = firstStatement("10 GOTO 100") as GotoStatement;
      expect(stmt.type).toBe("goto");
      expect(stmt.target).toBe(100);
    });
  });

  describe("FOR/NEXT statement", () => {
    it("parses FOR/TO", () => {
      const stmt = firstStatement("10 FOR I = 1 TO 10") as ForStatement;
      expect(stmt.type).toBe("for");
      expect(stmt.variable).toBe("I");
      expect((stmt.from as NumberLiteral).value).toBe(1);
      expect((stmt.to as NumberLiteral).value).toBe(10);
      expect(stmt.step).toBeUndefined();
    });

    it("parses FOR/TO/STEP", () => {
      const stmt = firstStatement(
        "10 FOR I = 10 TO 1 STEP -1",
      ) as ForStatement;
      expect(stmt.type).toBe("for");
      expect(stmt.variable).toBe("I");
      expect((stmt.from as NumberLiteral).value).toBe(10);
      expect((stmt.to as NumberLiteral).value).toBe(1);
      expect(stmt.step).toBeDefined();
      const step = stmt.step as UnaryExpression;
      expect(step.operator).toBe("-");
      expect((step.operand as NumberLiteral).value).toBe(1);
    });

    it("parses NEXT", () => {
      const stmt = firstStatement("10 NEXT I") as NextStatement;
      expect(stmt.type).toBe("next");
      expect(stmt.variable).toBe("I");
    });
  });

  describe("GOSUB/RETURN statement", () => {
    it("parses GOSUB", () => {
      const stmt = firstStatement("10 GOSUB 100") as GosubStatement;
      expect(stmt.type).toBe("gosub");
      expect(stmt.target).toBe(100);
    });

    it("parses RETURN", () => {
      const stmt = firstStatement("20 RETURN") as ReturnStatement;
      expect(stmt.type).toBe("return");
    });
  });

  describe("INPUT statement", () => {
    it("parses INPUT with variable only", () => {
      const stmt = firstStatement("10 INPUT X") as InputStatement;
      expect(stmt.type).toBe("input");
      expect(stmt.prompt).toBeUndefined();
      expect(stmt.variable).toBe("X");
    });

    it("parses INPUT with prompt", () => {
      const stmt = firstStatement(
        '10 INPUT "ENTER: "; X',
      ) as InputStatement;
      expect(stmt.type).toBe("input");
      expect(stmt.prompt).toBe("ENTER: ");
      expect(stmt.variable).toBe("X");
    });
  });

  describe("END statement", () => {
    it("parses END", () => {
      const stmt = firstStatement("10 END") as EndStatement;
      expect(stmt.type).toBe("end");
    });
  });

  describe("REM statement", () => {
    it("parses REM", () => {
      const stmt = firstStatement("10 REM comment") as RemStatement;
      expect(stmt.type).toBe("rem");
    });
  });

  describe("multiple statements on one line", () => {
    it("parses colon-separated statements", () => {
      const program = parseProgram("10 LET X = 1 : PRINT X");
      const stmts = program.lines[0].statements;
      expect(stmts).toHaveLength(2);
      expect(stmts[0].type).toBe("let");
      expect(stmts[1].type).toBe("print");
    });
  });

  describe("expression parsing", () => {
    it("parses arithmetic with correct precedence", () => {
      const stmt = firstStatement("10 PRINT 1 + 2 * 3") as PrintStatement;
      const expr = stmt.items[0] as BinaryExpression;
      // 1 + (2 * 3) — multiplication binds tighter
      expect(expr.type).toBe("binary");
      expect(expr.operator).toBe("+");
      expect((expr.left as NumberLiteral).value).toBe(1);
      const right = expr.right as BinaryExpression;
      expect(right.operator).toBe("*");
      expect((right.left as NumberLiteral).value).toBe(2);
      expect((right.right as NumberLiteral).value).toBe(3);
    });

    it("parses function calls", () => {
      const stmt = firstStatement("10 PRINT INT(3.7)") as PrintStatement;
      const expr = stmt.items[0] as FunctionCall;
      expect(expr.type).toBe("function");
      expect(expr.name).toBe("INT");
      expect(expr.args).toHaveLength(1);
      expect((expr.args[0] as NumberLiteral).value).toBe(3.7);
    });

    it("parses multi-argument function calls", () => {
      const stmt = firstStatement(
        '10 PRINT MID$("HELLO", 2, 3)',
      ) as PrintStatement;
      const expr = stmt.items[0] as FunctionCall;
      expect(expr.type).toBe("function");
      expect(expr.name).toBe("MID$");
      expect(expr.args).toHaveLength(3);
      expect((expr.args[0] as StringLiteral).value).toBe("HELLO");
      expect((expr.args[1] as NumberLiteral).value).toBe(2);
      expect((expr.args[2] as NumberLiteral).value).toBe(3);
    });

    it("parses unary minus", () => {
      const stmt = firstStatement("10 PRINT -5") as PrintStatement;
      const expr = stmt.items[0] as UnaryExpression;
      expect(expr.type).toBe("unary");
      expect(expr.operator).toBe("-");
      expect((expr.operand as NumberLiteral).value).toBe(5);
    });

    it("parses parenthesized expressions", () => {
      const stmt = firstStatement("10 PRINT (1 + 2) * 3") as PrintStatement;
      const expr = stmt.items[0] as BinaryExpression;
      expect(expr.operator).toBe("*");
      // left is (1 + 2), parentheses are transparent in the AST
      const left = expr.left as BinaryExpression;
      expect(left.operator).toBe("+");
      expect((left.left as NumberLiteral).value).toBe(1);
      expect((left.right as NumberLiteral).value).toBe(2);
      expect((expr.right as NumberLiteral).value).toBe(3);
    });

    it("parses comparison operators", () => {
      for (const [op, symbol] of [
        ["<", "<"],
        [">", ">"],
        ["<=", "<="],
        [">=", ">="],
        ["<>", "<>"],
        ["=", "="],
      ] as const) {
        const stmt = firstStatement(
          `10 IF X ${op} 1 THEN END`,
        ) as IfStatement;
        const cond = stmt.condition as BinaryExpression;
        expect(cond.type).toBe("binary");
        expect(cond.operator).toBe(symbol);
      }
    });
  });

  describe("multiple program lines", () => {
    it("parses multiple lines into separate ProgramLines", () => {
      const program = parseProgram("10 LET X = 1\n20 PRINT X\n30 END");
      expect(program.lines).toHaveLength(3);
      expect(program.lines[0].lineNumber).toBe(10);
      expect(program.lines[0].statements[0].type).toBe("let");
      expect(program.lines[1].lineNumber).toBe(20);
      expect(program.lines[1].statements[0].type).toBe("print");
      expect(program.lines[2].lineNumber).toBe(30);
      expect(program.lines[2].statements[0].type).toBe("end");
    });
  });

  describe("sourceLine tracking", () => {
    it("sets sourceLine on statements", () => {
      const program = parseProgram("10 LET X = 1\n20 PRINT X");
      expect(program.lines[0].statements[0].sourceLine).toBe(10);
      expect(program.lines[1].statements[0].sourceLine).toBe(20);
    });

    it("sets sourceLine on colon-separated statements", () => {
      const program = parseProgram("10 LET X = 1 : PRINT X");
      expect(program.lines[0].statements[0].sourceLine).toBe(10);
      expect(program.lines[0].statements[1].sourceLine).toBe(10);
    });
  });

  describe("error handling", () => {
    it("reports error for missing line number", () => {
      expect(() => parseProgram("PRINT 42")).toThrow(ParseError);
    });

    it("reports error for malformed expressions", () => {
      expect(() => parseProgram("10 PRINT +")).toThrow(ParseError);
    });
  });
});
