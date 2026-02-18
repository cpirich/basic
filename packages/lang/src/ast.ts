// ── Expression types ────────────────────────────────────────────────

export interface NumberLiteral {
  type: "number";
  value: number;
}

export interface StringLiteral {
  type: "string";
  value: string;
}

export interface Variable {
  type: "variable";
  name: string; // includes $ suffix for string variables
}

export interface BinaryExpression {
  type: "binary";
  operator: string;
  left: Expression;
  right: Expression;
}

export interface UnaryExpression {
  type: "unary";
  operator: string;
  operand: Expression;
}

export interface FunctionCall {
  type: "function";
  name: string;
  args: Expression[];
}

export type Expression =
  | NumberLiteral
  | StringLiteral
  | Variable
  | BinaryExpression
  | UnaryExpression
  | FunctionCall;

// ── Statement types ─────────────────────────────────────────────────

export interface LetStatement {
  type: "let";
  variable: string;
  value: Expression;
  sourceLine: number;
}

export interface PrintStatement {
  type: "print";
  items: Array<Expression | ";">;
  sourceLine: number;
}

export interface IfStatement {
  type: "if";
  condition: Expression;
  thenBranch: Statement[];
  elseBranch?: Statement[];
  sourceLine: number;
}

export interface GotoStatement {
  type: "goto";
  target: number;
  sourceLine: number;
}

export interface ForStatement {
  type: "for";
  variable: string;
  from: Expression;
  to: Expression;
  step?: Expression;
  sourceLine: number;
}

export interface NextStatement {
  type: "next";
  variable: string;
  sourceLine: number;
}

export interface GosubStatement {
  type: "gosub";
  target: number;
  sourceLine: number;
}

export interface ReturnStatement {
  type: "return";
  sourceLine: number;
}

export interface InputStatement {
  type: "input";
  prompt?: string;
  variable: string;
  sourceLine: number;
}

export interface EndStatement {
  type: "end";
  sourceLine: number;
}

export interface RemStatement {
  type: "rem";
  sourceLine: number;
}

export type Statement =
  | LetStatement
  | PrintStatement
  | IfStatement
  | GotoStatement
  | ForStatement
  | NextStatement
  | GosubStatement
  | ReturnStatement
  | InputStatement
  | EndStatement
  | RemStatement;

// ── Program structure ───────────────────────────────────────────────

export interface ProgramLine {
  lineNumber: number;
  statements: Statement[];
}

export interface Program {
  lines: ProgramLine[];
}
