import { describe, it, expect } from "vitest";
import { lex } from "../src/lexer.js";
import { TokenType } from "../src/tokens.js";
import { LexError } from "../src/errors.js";

describe("lex", () => {
  it("tokenizes integer numbers", () => {
    const tokens = lex("42");
    expect(tokens[0]).toEqual({ type: TokenType.NUMBER, value: "42", line: 1, column: 1 });
    expect(tokens[1].type).toBe(TokenType.EOF);
  });

  it("tokenizes decimal numbers", () => {
    const tokens = lex("3.14");
    expect(tokens[0]).toEqual({ type: TokenType.NUMBER, value: "3.14", line: 1, column: 1 });
  });

  it("tokenizes string literals", () => {
    const tokens = lex('"HELLO"');
    expect(tokens[0]).toEqual({ type: TokenType.STRING, value: "HELLO", line: 1, column: 1 });
  });

  it("tokenizes regular identifiers", () => {
    const tokens = lex("myVar");
    expect(tokens[0]).toEqual({ type: TokenType.IDENTIFIER, value: "MYVAR", line: 1, column: 1 });
  });

  it("tokenizes string identifiers with $", () => {
    const tokens = lex("name$");
    expect(tokens[0]).toEqual({ type: TokenType.STRING_IDENT, value: "NAME$", line: 1, column: 1 });
  });

  it("recognizes all keywords case-insensitively", () => {
    for (const input of ["print", "PRINT", "Print"]) {
      const tokens = lex(input);
      expect(tokens[0].type).toBe(TokenType.PRINT);
      expect(tokens[0].value).toBe("PRINT");
    }
  });

  it("recognizes every keyword", () => {
    const keywords = [
      "LET", "PRINT", "IF", "THEN", "ELSE", "GOTO", "FOR", "TO",
      "NEXT", "STEP", "GOSUB", "RETURN", "INPUT", "END", "MOD", "AND", "OR", "NOT",
    ];
    for (const kw of keywords) {
      const tokens = lex(kw);
      expect(tokens[0].type).toBe(kw as TokenType);
    }
  });

  it("tokenizes all single-character operators", () => {
    const tokens = lex("+ - * / =");
    expect(tokens[0].type).toBe(TokenType.PLUS);
    expect(tokens[1].type).toBe(TokenType.MINUS);
    expect(tokens[2].type).toBe(TokenType.STAR);
    expect(tokens[3].type).toBe(TokenType.SLASH);
    expect(tokens[4].type).toBe(TokenType.EQUALS);
  });

  it("tokenizes two-character operators", () => {
    const tokens = lex("<> <= >=");
    expect(tokens[0]).toEqual({ type: TokenType.NOT_EQUALS, value: "<>", line: 1, column: 1 });
    expect(tokens[1]).toEqual({ type: TokenType.LESS_EQUALS, value: "<=", line: 1, column: 4 });
    expect(tokens[2]).toEqual({ type: TokenType.GREATER_EQUALS, value: ">=", line: 1, column: 7 });
  });

  it("tokenizes less-than and greater-than", () => {
    const tokens = lex("< >");
    expect(tokens[0].type).toBe(TokenType.LESS);
    expect(tokens[1].type).toBe(TokenType.GREATER);
  });

  it("handles REM comments consuming rest of line", () => {
    const tokens = lex("REM this is a comment\n10");
    expect(tokens[0].type).toBe(TokenType.REM);
    expect(tokens[0].value).toBe("REM this is a comment");
    expect(tokens[1]).toEqual({ type: TokenType.NUMBER, value: "10", line: 2, column: 1 });
  });

  it("handles REM at end of input", () => {
    const tokens = lex("REM end comment");
    expect(tokens[0].type).toBe(TokenType.REM);
    expect(tokens[0].value).toBe("REM end comment");
    expect(tokens[1].type).toBe(TokenType.EOF);
  });

  it("tokenizes colon separator", () => {
    const tokens = lex(":");
    expect(tokens[0].type).toBe(TokenType.COLON);
  });

  it("tokenizes semicolons and commas", () => {
    const tokens = lex(";,");
    expect(tokens[0].type).toBe(TokenType.SEMICOLON);
    expect(tokens[1].type).toBe(TokenType.COMMA);
  });

  it("tokenizes parentheses", () => {
    const tokens = lex("()");
    expect(tokens[0].type).toBe(TokenType.LPAREN);
    expect(tokens[1].type).toBe(TokenType.RPAREN);
  });

  it("tracks line and column numbers correctly", () => {
    const tokens = lex("10 PRINT\n20 GOTO");
    // 10 at line 1, col 1
    expect(tokens[0]).toEqual({ type: TokenType.NUMBER, value: "10", line: 1, column: 1 });
    // PRINT at line 1, col 4
    expect(tokens[1]).toEqual({ type: TokenType.PRINT, value: "PRINT", line: 1, column: 4 });
    // 20 at line 2, col 1
    expect(tokens[2]).toEqual({ type: TokenType.NUMBER, value: "20", line: 2, column: 1 });
    // GOTO at line 2, col 4
    expect(tokens[3]).toEqual({ type: TokenType.GOTO, value: "GOTO", line: 2, column: 4 });
  });

  it("throws LexError on unterminated strings", () => {
    expect(() => lex('"hello')).toThrow(LexError);
    expect(() => lex('"hello')).toThrow("Unterminated string");
  });

  it("throws LexError on unterminated string at newline", () => {
    expect(() => lex('"hello\nworld')).toThrow(LexError);
  });

  it("throws LexError on invalid characters", () => {
    expect(() => lex("@")).toThrow(LexError);
    expect(() => lex("@")).toThrow("Unexpected character: @");
  });

  it("tokenizes a full BASIC line", () => {
    const tokens = lex('10 PRINT "HELLO"');
    expect(tokens).toEqual([
      { type: TokenType.NUMBER, value: "10", line: 1, column: 1 },
      { type: TokenType.PRINT, value: "PRINT", line: 1, column: 4 },
      { type: TokenType.STRING, value: "HELLO", line: 1, column: 10 },
      { type: TokenType.EOF, value: "", line: 1, column: 17 },
    ]);
  });

  it("tokenizes multi-line programs with proper line tracking", () => {
    const source = '10 LET X = 5\n20 PRINT X\n30 END';
    const tokens = lex(source);

    // Line 1: 10 LET X = 5
    expect(tokens[0]).toEqual({ type: TokenType.NUMBER, value: "10", line: 1, column: 1 });
    expect(tokens[1]).toEqual({ type: TokenType.LET, value: "LET", line: 1, column: 4 });
    expect(tokens[2]).toEqual({ type: TokenType.IDENTIFIER, value: "X", line: 1, column: 8 });
    expect(tokens[3]).toEqual({ type: TokenType.EQUALS, value: "=", line: 1, column: 10 });
    expect(tokens[4]).toEqual({ type: TokenType.NUMBER, value: "5", line: 1, column: 12 });

    // Line 2: 20 PRINT X
    expect(tokens[5]).toEqual({ type: TokenType.NUMBER, value: "20", line: 2, column: 1 });
    expect(tokens[6]).toEqual({ type: TokenType.PRINT, value: "PRINT", line: 2, column: 4 });
    expect(tokens[7]).toEqual({ type: TokenType.IDENTIFIER, value: "X", line: 2, column: 10 });

    // Line 3: 30 END
    expect(tokens[8]).toEqual({ type: TokenType.NUMBER, value: "30", line: 3, column: 1 });
    expect(tokens[9]).toEqual({ type: TokenType.END, value: "END", line: 3, column: 4 });

    expect(tokens[10].type).toBe(TokenType.EOF);
  });

  it("skips whitespace correctly", () => {
    const tokens = lex("  \t  42");
    expect(tokens[0]).toEqual({ type: TokenType.NUMBER, value: "42", line: 1, column: 6 });
  });

  it("appends EOF token at the end", () => {
    const tokens = lex("");
    expect(tokens).toHaveLength(1);
    expect(tokens[0].type).toBe(TokenType.EOF);
  });

  it("handles expressions with mixed operators", () => {
    const tokens = lex("X + Y * 2");
    expect(tokens.map((t) => t.type)).toEqual([
      TokenType.IDENTIFIER,
      TokenType.PLUS,
      TokenType.IDENTIFIER,
      TokenType.STAR,
      TokenType.NUMBER,
      TokenType.EOF,
    ]);
  });
});
