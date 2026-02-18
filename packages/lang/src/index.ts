import { lex } from "./lexer.js";
import { parse } from "./parser.js";

export { lex, parse };
export { createInterpreter } from "./evaluator.js";
export type { InterpreterEvent } from "./evaluator.js";
export type { Token } from "./tokens.js";
export { TokenType } from "./tokens.js";
export type { Program, ProgramLine, Statement, Expression } from "./ast.js";
export { MiniBasicError, LexError, ParseError, RuntimeError } from "./errors.js";

export const VERSION = "0.1.0";

export function compile(source: string) {
  return parse(lex(source));
}
