import { RuntimeError } from "./errors.js";
import { callBuiltin } from "./builtins.js";
import type { Program, Statement, Expression } from "./ast.js";

export type InterpreterEvent =
  | { type: "print"; text: string }
  | { type: "input"; prompt: string }
  | { type: "end" }
  | { type: "error"; error: RuntimeError };

interface ForEntry {
  variable: string;
  limit: number;
  step: number;
  returnLineIndex: number;
  returnStmtIndex: number;
}

interface ReturnAddress {
  lineIndex: number;
  stmtIndex: number;
}

export async function* createInterpreter(
  program: Program,
): AsyncGenerator<InterpreterEvent, void, string | undefined> {
  // Build line number → index lookup
  const lineMap = new Map<number, number>();
  for (let i = 0; i < program.lines.length; i++) {
    lineMap.set(program.lines[i].lineNumber, i);
  }

  const variables = new Map<string, number | string>();
  const forStack: ForEntry[] = [];
  const gosubStack: ReturnAddress[] = [];
  let lineIndex = 0;
  let stmtIndex = 0;

  function isStringVar(name: string): boolean {
    return name.endsWith("$");
  }

  function getVar(name: string): number | string {
    const val = variables.get(name);
    if (val !== undefined) return val;
    return isStringVar(name) ? "" : 0;
  }

  function evaluate(expr: Expression, sourceLine: number): number | string {
    switch (expr.type) {
      case "number":
        return expr.value;
      case "string":
        return expr.value;
      case "variable":
        return getVar(expr.name);
      case "binary":
        return evalBinary(expr.operator, expr.left, expr.right, sourceLine);
      case "unary":
        return evalUnary(expr.operator, expr.operand, sourceLine);
      case "function": {
        const args = expr.args.map((a) => evaluate(a, sourceLine));
        return callBuiltin(expr.name, args, sourceLine);
      }
    }
  }

  function evalBinary(
    op: string,
    leftExpr: Expression,
    rightExpr: Expression,
    sourceLine: number,
  ): number | string {
    const left = evaluate(leftExpr, sourceLine);
    const right = evaluate(rightExpr, sourceLine);

    // String concatenation
    if (op === "+" && typeof left === "string" && typeof right === "string") {
      return left + right;
    }

    // Comparison operators work on both numbers and strings
    if (["=", "<>", "<", ">", "<=", ">="].includes(op)) {
      if (typeof left === "string" && typeof right === "string") {
        return evalStringComparison(op, left, right);
      }
      if (typeof left === "number" && typeof right === "number") {
        return evalNumericComparison(op, left, right);
      }
      throw new RuntimeError("Type mismatch in comparison", sourceLine);
    }

    // Logical operators
    if (op === "AND") {
      return (isTruthy(left) && isTruthy(right)) ? -1 : 0;
    }
    if (op === "OR") {
      return (isTruthy(left) || isTruthy(right)) ? -1 : 0;
    }

    // Arithmetic operators require numbers
    if (typeof left !== "number" || typeof right !== "number") {
      throw new RuntimeError("Type mismatch in arithmetic", sourceLine);
    }

    switch (op) {
      case "+": return left + right;
      case "-": return left - right;
      case "*": return left * right;
      case "/":
        if (right === 0) throw new RuntimeError("Division by zero", sourceLine);
        return left / right;
      case "MOD":
        if (right === 0) throw new RuntimeError("Division by zero", sourceLine);
        return left % right;
      default:
        throw new RuntimeError(`Unknown operator: ${op}`, sourceLine);
    }
  }

  function evalNumericComparison(op: string, left: number, right: number): number {
    switch (op) {
      case "=": return left === right ? -1 : 0;
      case "<>": return left !== right ? -1 : 0;
      case "<": return left < right ? -1 : 0;
      case ">": return left > right ? -1 : 0;
      case "<=": return left <= right ? -1 : 0;
      case ">=": return left >= right ? -1 : 0;
      default: return 0;
    }
  }

  function evalStringComparison(op: string, left: string, right: string): number {
    switch (op) {
      case "=": return left === right ? -1 : 0;
      case "<>": return left !== right ? -1 : 0;
      case "<": return left < right ? -1 : 0;
      case ">": return left > right ? -1 : 0;
      case "<=": return left <= right ? -1 : 0;
      case ">=": return left >= right ? -1 : 0;
      default: return 0;
    }
  }

  function evalUnary(op: string, operandExpr: Expression, sourceLine: number): number {
    const operand = evaluate(operandExpr, sourceLine);
    if (op === "-") {
      if (typeof operand !== "number") {
        throw new RuntimeError("Type mismatch: cannot negate a string", sourceLine);
      }
      return -operand;
    }
    if (op === "NOT") {
      return isTruthy(operand) ? 0 : -1;
    }
    throw new RuntimeError(`Unknown unary operator: ${op}`, sourceLine);
  }

  function isTruthy(value: number | string): boolean {
    if (typeof value === "number") return value !== 0;
    return value.length > 0;
  }

  function jumpToLine(target: number, sourceLine: number): void {
    const idx = lineMap.get(target);
    if (idx === undefined) {
      throw new RuntimeError(`Undefined line number: ${target}`, sourceLine);
    }
    lineIndex = idx;
    stmtIndex = 0;
  }

  function advanceStatement(): void {
    stmtIndex++;
    if (stmtIndex >= program.lines[lineIndex].statements.length) {
      lineIndex++;
      stmtIndex = 0;
    }
  }

  try {
    while (lineIndex < program.lines.length) {
      const line = program.lines[lineIndex];
      if (stmtIndex >= line.statements.length) {
        lineIndex++;
        stmtIndex = 0;
        continue;
      }

      const stmt = line.statements[stmtIndex];

      switch (stmt.type) {
        case "let": {
          const value = evaluate(stmt.value, stmt.sourceLine);
          variables.set(stmt.variable, value);
          advanceStatement();
          break;
        }

        case "print": {
          let text = "";
          for (const item of stmt.items) {
            if (item === ";") {
              // semicolons separate items without spacing
            } else {
              const val = evaluate(item, stmt.sourceLine);
              text += String(val);
            }
          }
          yield { type: "print", text };
          advanceStatement();
          break;
        }

        case "if": {
          const cond = evaluate(stmt.condition, stmt.sourceLine);
          const branch = isTruthy(cond) ? stmt.thenBranch : stmt.elseBranch;
          if (branch) {
            for (const s of branch) {
              // Execute sub-statements — need to handle jumps
              const result = yield* executeSubStatement(s);
              if (result === "jumped") return;
              if (result === "jump") break;
            }
          }
          // Only advance if we didn't jump
          if (lineIndex < program.lines.length &&
              stmtIndex < program.lines[lineIndex].statements.length &&
              program.lines[lineIndex].statements[stmtIndex] === stmt) {
            advanceStatement();
          }
          break;
        }

        case "goto": {
          jumpToLine(stmt.target, stmt.sourceLine);
          break;
        }

        case "for": {
          const from = evaluate(stmt.from, stmt.sourceLine);
          const to = evaluate(stmt.to, stmt.sourceLine);
          const step = stmt.step ? evaluate(stmt.step, stmt.sourceLine) : 1;
          if (typeof from !== "number" || typeof to !== "number" || typeof step !== "number") {
            throw new RuntimeError("FOR requires numeric values", stmt.sourceLine);
          }
          variables.set(stmt.variable, from);
          // Save return address as the next statement after this FOR
          const returnLineIndex = lineIndex;
          const returnStmtIndex = stmtIndex + 1;
          forStack.push({
            variable: stmt.variable,
            limit: to,
            step,
            returnLineIndex,
            returnStmtIndex,
          });
          advanceStatement();
          break;
        }

        case "next": {
          const entry = findForEntry(stmt.variable, stmt.sourceLine);
          const current = getVar(stmt.variable);
          if (typeof current !== "number") {
            throw new RuntimeError("FOR variable must be numeric", stmt.sourceLine);
          }
          const next = current + entry.step;
          variables.set(stmt.variable, next);
          const done =
            entry.step > 0 ? next > entry.limit : next < entry.limit;
          if (done) {
            // Remove the FOR entry
            const idx = forStack.lastIndexOf(entry);
            if (idx !== -1) forStack.splice(idx, 1);
            advanceStatement();
          } else {
            // Jump back to after the FOR
            lineIndex = entry.returnLineIndex;
            stmtIndex = entry.returnStmtIndex;
            // Advance past FOR line if returnStmtIndex is past end
            if (stmtIndex >= program.lines[lineIndex].statements.length) {
              lineIndex++;
              stmtIndex = 0;
            }
          }
          break;
        }

        case "gosub": {
          // Save return to next statement
          const retLineIndex = lineIndex;
          const retStmtIndex = stmtIndex + 1;
          let rl = retLineIndex;
          let rs = retStmtIndex;
          if (rs >= program.lines[rl].statements.length) {
            rl++;
            rs = 0;
          }
          gosubStack.push({ lineIndex: rl, stmtIndex: rs });
          jumpToLine(stmt.target, stmt.sourceLine);
          break;
        }

        case "return": {
          if (gosubStack.length === 0) {
            throw new RuntimeError("RETURN without GOSUB", stmt.sourceLine);
          }
          const ret = gosubStack.pop()!;
          lineIndex = ret.lineIndex;
          stmtIndex = ret.stmtIndex;
          break;
        }

        case "input": {
          const prompt = stmt.prompt ?? "? ";
          const input: string | undefined = yield { type: "input", prompt };
          const value = input ?? "";
          if (isStringVar(stmt.variable)) {
            variables.set(stmt.variable, value);
          } else {
            const num = parseFloat(value);
            variables.set(stmt.variable, isNaN(num) ? 0 : num);
          }
          advanceStatement();
          break;
        }

        case "end": {
          yield { type: "end" };
          return;
        }

        case "rem": {
          advanceStatement();
          break;
        }
      }
    }

    yield { type: "end" };
  } catch (err) {
    if (err instanceof RuntimeError) {
      yield { type: "error", error: err };
    } else {
      yield {
        type: "error",
        error: new RuntimeError(String(err)),
      };
    }
  }

  // Helper generator for executing sub-statements inside IF branches
  async function* executeSubStatement(
    stmt: Statement,
  ): AsyncGenerator<InterpreterEvent, "jumped" | "jump" | "normal", string | undefined> {
    switch (stmt.type) {
      case "goto":
        jumpToLine(stmt.target, stmt.sourceLine);
        return "jump";
      case "gosub": {
        const retLI = lineIndex;
        const retSI = stmtIndex + 1;
        let rl = retLI;
        let rs = retSI;
        if (rs >= program.lines[rl].statements.length) {
          rl++;
          rs = 0;
        }
        gosubStack.push({ lineIndex: rl, stmtIndex: rs });
        jumpToLine(stmt.target, stmt.sourceLine);
        return "jump";
      }
      case "let": {
        const value = evaluate(stmt.value, stmt.sourceLine);
        variables.set(stmt.variable, value);
        return "normal";
      }
      case "print": {
        let text = "";
        for (const item of stmt.items) {
          if (item !== ";") {
            text += String(evaluate(item, stmt.sourceLine));
          }
        }
        yield { type: "print", text };
        return "normal";
      }
      case "end":
        yield { type: "end" };
        return "jumped";
      case "input": {
        const prompt = stmt.prompt ?? "? ";
        const input: string | undefined = yield { type: "input", prompt };
        const value = input ?? "";
        if (isStringVar(stmt.variable)) {
          variables.set(stmt.variable, value);
        } else {
          const num = parseFloat(value);
          variables.set(stmt.variable, isNaN(num) ? 0 : num);
        }
        return "normal";
      }
      case "return": {
        if (gosubStack.length === 0) {
          throw new RuntimeError("RETURN without GOSUB", stmt.sourceLine);
        }
        const ret = gosubStack.pop()!;
        lineIndex = ret.lineIndex;
        stmtIndex = ret.stmtIndex;
        return "jump";
      }
      default:
        return "normal";
    }
  }

  function findForEntry(variable: string, sourceLine: number): ForEntry {
    for (let i = forStack.length - 1; i >= 0; i--) {
      if (forStack[i].variable === variable) {
        return forStack[i];
      }
    }
    throw new RuntimeError(`NEXT without FOR: ${variable}`, sourceLine);
  }
}
