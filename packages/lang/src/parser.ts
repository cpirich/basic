import { Token, TokenType } from "./tokens.js";
import { ParseError } from "./errors.js";
import type {
  Program,
  ProgramLine,
  Statement,
  Expression,
} from "./ast.js";

export function parse(tokens: Token[]): Program {
  let pos = 0;

  function peek(): Token {
    return tokens[pos];
  }

  function advance(): Token {
    const token = tokens[pos];
    pos++;
    return token;
  }

  function expect(type: TokenType): Token {
    const token = peek();
    if (token.type !== type) {
      throw new ParseError(
        `Expected ${type} but got ${token.type} ("${token.value}")`,
        token.line,
      );
    }
    return advance();
  }

  function match(type: TokenType): Token | null {
    if (peek().type === type) {
      return advance();
    }
    return null;
  }

  function isAtEnd(): boolean {
    return peek().type === TokenType.EOF;
  }

  // ── Program ──────────────────────────────────────────────────────

  function parseProgram(): Program {
    const lines: ProgramLine[] = [];
    while (!isAtEnd()) {
      lines.push(parseProgramLine());
    }
    return { lines };
  }

  function parseProgramLine(): ProgramLine {
    const lineToken = peek();
    if (lineToken.type !== TokenType.NUMBER) {
      throw new ParseError(
        `Expected line number but got ${lineToken.type} ("${lineToken.value}")`,
        lineToken.line,
      );
    }
    advance();
    const lineNumber = Number(lineToken.value);
    const statements: Statement[] = [];

    statements.push(parseStatement(lineNumber));
    while (match(TokenType.COLON)) {
      statements.push(parseStatement(lineNumber));
    }

    return { lineNumber, statements };
  }

  // ── Statements ───────────────────────────────────────────────────

  function parseStatement(sourceLine: number): Statement {
    const token = peek();

    switch (token.type) {
      case TokenType.LET:
        return parseLetStatement(sourceLine);
      case TokenType.PRINT:
        return parsePrintStatement(sourceLine);
      case TokenType.IF:
        return parseIfStatement(sourceLine);
      case TokenType.GOTO:
        return parseGotoStatement(sourceLine);
      case TokenType.FOR:
        return parseForStatement(sourceLine);
      case TokenType.NEXT:
        return parseNextStatement(sourceLine);
      case TokenType.GOSUB:
        return parseGosubStatement(sourceLine);
      case TokenType.RETURN:
        advance();
        return { type: "return", sourceLine };
      case TokenType.INPUT:
        return parseInputStatement(sourceLine);
      case TokenType.END:
        advance();
        return { type: "end", sourceLine };
      case TokenType.REM:
        advance();
        return { type: "rem", sourceLine };
      case TokenType.IDENTIFIER:
      case TokenType.STRING_IDENT:
        // Implicit LET: X = 5 or X$ = "hello"
        return parseImplicitLet(sourceLine);
      default:
        throw new ParseError(
          `Unexpected token ${token.type} ("${token.value}")`,
          token.line,
        );
    }
  }

  function parseLetStatement(sourceLine: number): Statement {
    advance(); // consume LET
    const nameToken = peek();
    if (
      nameToken.type !== TokenType.IDENTIFIER &&
      nameToken.type !== TokenType.STRING_IDENT
    ) {
      throw new ParseError(
        `Expected variable name after LET but got ${nameToken.type}`,
        nameToken.line,
      );
    }
    advance();
    expect(TokenType.EQUALS);
    const value = parseExpression();
    return { type: "let", variable: nameToken.value, value, sourceLine };
  }

  function parseImplicitLet(sourceLine: number): Statement {
    const nameToken = advance();
    expect(TokenType.EQUALS);
    const value = parseExpression();
    return { type: "let", variable: nameToken.value, value, sourceLine };
  }

  function parsePrintStatement(sourceLine: number): Statement {
    advance(); // consume PRINT
    const items: Array<Expression | ";"> = [];

    // Handle PRINT with no arguments (prints newline)
    if (!canStartExpression()) {
      return { type: "print", items, sourceLine };
    }

    items.push(parseExpression());
    while (peek().type === TokenType.SEMICOLON) {
      advance(); // consume ;
      items.push(";");
      if (canStartExpression()) {
        items.push(parseExpression());
      }
    }

    return { type: "print", items, sourceLine };
  }

  function parseIfStatement(sourceLine: number): Statement {
    advance(); // consume IF
    const condition = parseExpression();
    expect(TokenType.THEN);

    const thenBranch: Statement[] = [];
    // Parse statements until ELSE, COLON, next line number, or end
    while (
      !isAtEnd() &&
      peek().type !== TokenType.ELSE &&
      peek().type !== TokenType.COLON &&
      peek().type !== TokenType.NUMBER
    ) {
      thenBranch.push(parseStatement(sourceLine));
    }

    let elseBranch: Statement[] | undefined;
    if (match(TokenType.ELSE)) {
      elseBranch = [];
      while (
        !isAtEnd() &&
        peek().type !== TokenType.COLON &&
        peek().type !== TokenType.NUMBER
      ) {
        elseBranch.push(parseStatement(sourceLine));
      }
    }

    return { type: "if", condition, thenBranch, elseBranch, sourceLine };
  }

  function parseGotoStatement(sourceLine: number): Statement {
    advance(); // consume GOTO
    const target = expect(TokenType.NUMBER);
    return { type: "goto", target: Number(target.value), sourceLine };
  }

  function parseForStatement(sourceLine: number): Statement {
    advance(); // consume FOR
    const varToken = peek();
    if (
      varToken.type !== TokenType.IDENTIFIER &&
      varToken.type !== TokenType.STRING_IDENT
    ) {
      throw new ParseError(
        `Expected variable after FOR but got ${varToken.type}`,
        varToken.line,
      );
    }
    advance();
    expect(TokenType.EQUALS);
    const from = parseExpression();
    expect(TokenType.TO);
    const to = parseExpression();
    let step: Expression | undefined;
    if (match(TokenType.STEP)) {
      step = parseExpression();
    }
    return {
      type: "for",
      variable: varToken.value,
      from,
      to,
      step,
      sourceLine,
    };
  }

  function parseNextStatement(sourceLine: number): Statement {
    advance(); // consume NEXT
    const varToken = peek();
    if (
      varToken.type !== TokenType.IDENTIFIER &&
      varToken.type !== TokenType.STRING_IDENT
    ) {
      throw new ParseError(
        `Expected variable after NEXT but got ${varToken.type}`,
        varToken.line,
      );
    }
    advance();
    return { type: "next", variable: varToken.value, sourceLine };
  }

  function parseGosubStatement(sourceLine: number): Statement {
    advance(); // consume GOSUB
    const target = expect(TokenType.NUMBER);
    return { type: "gosub", target: Number(target.value), sourceLine };
  }

  function parseInputStatement(sourceLine: number): Statement {
    advance(); // consume INPUT
    let prompt: string | undefined;

    // Check for optional prompt string
    if (peek().type === TokenType.STRING) {
      const saved = pos;
      const str = advance();
      if (peek().type === TokenType.SEMICOLON) {
        advance(); // consume ;
        prompt = str.value;
      } else {
        // Not a prompt, rewind
        pos = saved;
      }
    }

    const varToken = peek();
    if (
      varToken.type !== TokenType.IDENTIFIER &&
      varToken.type !== TokenType.STRING_IDENT
    ) {
      throw new ParseError(
        `Expected variable for INPUT but got ${varToken.type}`,
        varToken.line,
      );
    }
    advance();
    return { type: "input", prompt, variable: varToken.value, sourceLine };
  }

  function canStartExpression(): boolean {
    const t = peek().type;
    return (
      t === TokenType.NUMBER ||
      t === TokenType.STRING ||
      t === TokenType.IDENTIFIER ||
      t === TokenType.STRING_IDENT ||
      t === TokenType.LPAREN ||
      t === TokenType.MINUS ||
      t === TokenType.NOT
    );
  }

  // ── Expressions ──────────────────────────────────────────────────

  function parseExpression(): Expression {
    return parseOr();
  }

  function parseOr(): Expression {
    let left = parseAnd();
    while (peek().type === TokenType.OR) {
      advance();
      const right = parseAnd();
      left = { type: "binary", operator: "OR", left, right };
    }
    return left;
  }

  function parseAnd(): Expression {
    let left = parseNot();
    while (peek().type === TokenType.AND) {
      advance();
      const right = parseNot();
      left = { type: "binary", operator: "AND", left, right };
    }
    return left;
  }

  function parseNot(): Expression {
    if (peek().type === TokenType.NOT) {
      advance();
      const operand = parseNot();
      return { type: "unary", operator: "NOT", operand };
    }
    return parseComparison();
  }

  function parseComparison(): Expression {
    let left = parseAddition();
    const compOps = [
      TokenType.EQUALS,
      TokenType.NOT_EQUALS,
      TokenType.LESS,
      TokenType.GREATER,
      TokenType.LESS_EQUALS,
      TokenType.GREATER_EQUALS,
    ];
    while (compOps.includes(peek().type)) {
      const op = advance();
      const right = parseAddition();
      left = { type: "binary", operator: op.value, left, right };
    }
    return left;
  }

  function parseAddition(): Expression {
    let left = parseMultiplication();
    while (
      peek().type === TokenType.PLUS ||
      peek().type === TokenType.MINUS
    ) {
      const op = advance();
      const right = parseMultiplication();
      left = { type: "binary", operator: op.value, left, right };
    }
    return left;
  }

  function parseMultiplication(): Expression {
    let left = parseUnary();
    while (
      peek().type === TokenType.STAR ||
      peek().type === TokenType.SLASH ||
      peek().type === TokenType.MOD
    ) {
      const op = advance();
      const right = parseUnary();
      left = { type: "binary", operator: op.value, left, right };
    }
    return left;
  }

  function parseUnary(): Expression {
    if (peek().type === TokenType.MINUS) {
      advance();
      const operand = parseUnary();
      return { type: "unary", operator: "-", operand };
    }
    return parsePrimary();
  }

  function parsePrimary(): Expression {
    const token = peek();

    // Number literal
    if (token.type === TokenType.NUMBER) {
      advance();
      return { type: "number", value: Number(token.value) };
    }

    // String literal
    if (token.type === TokenType.STRING) {
      advance();
      return { type: "string", value: token.value };
    }

    // Identifier or function call
    if (
      token.type === TokenType.IDENTIFIER ||
      token.type === TokenType.STRING_IDENT
    ) {
      advance();
      // Check for function call
      if (peek().type === TokenType.LPAREN) {
        advance(); // consume (
        const args: Expression[] = [];
        if (peek().type !== TokenType.RPAREN) {
          args.push(parseExpression());
          while (match(TokenType.COMMA)) {
            args.push(parseExpression());
          }
        }
        expect(TokenType.RPAREN);
        return { type: "function", name: token.value, args };
      }
      return { type: "variable", name: token.value };
    }

    // Parenthesized expression
    if (token.type === TokenType.LPAREN) {
      advance();
      const expr = parseExpression();
      expect(TokenType.RPAREN);
      return expr;
    }

    throw new ParseError(
      `Unexpected token in expression: ${token.type} ("${token.value}")`,
      token.line,
    );
  }

  return parseProgram();
}
