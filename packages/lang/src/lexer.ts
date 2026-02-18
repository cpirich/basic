import { Token, TokenType, KEYWORDS } from "./tokens.js";
import { LexError } from "./errors.js";

export function lex(source: string): Token[] {
  const tokens: Token[] = [];
  let pos = 0;
  let line = 1;
  let column = 1;

  function peek(): string {
    return pos < source.length ? source[pos] : "\0";
  }

  function advance(): string {
    const ch = source[pos];
    pos++;
    column++;
    return ch;
  }

  while (pos < source.length) {
    const ch = peek();

    // Whitespace (skip spaces and tabs)
    if (ch === " " || ch === "\t") {
      advance();
      continue;
    }

    // Newlines
    if (ch === "\n") {
      advance();
      line++;
      column = 1;
      continue;
    }
    if (ch === "\r") {
      advance();
      if (peek() === "\n") advance();
      line++;
      column = 1;
      continue;
    }

    const startColumn = column;

    // Numbers
    if (ch >= "0" && ch <= "9") {
      let num = "";
      while (pos < source.length && peek() >= "0" && peek() <= "9") {
        num += advance();
      }
      if (pos < source.length && peek() === ".") {
        num += advance();
        while (pos < source.length && peek() >= "0" && peek() <= "9") {
          num += advance();
        }
      }
      tokens.push({ type: TokenType.NUMBER, value: num, line, column: startColumn });
      continue;
    }

    // Strings
    if (ch === '"') {
      advance(); // consume opening quote
      let str = "";
      while (pos < source.length && peek() !== '"' && peek() !== "\n") {
        str += advance();
      }
      if (pos >= source.length || peek() === "\n") {
        throw new LexError("Unterminated string", line);
      }
      advance(); // consume closing quote
      tokens.push({ type: TokenType.STRING, value: str, line, column: startColumn });
      continue;
    }

    // Identifiers and keywords
    if ((ch >= "a" && ch <= "z") || (ch >= "A" && ch <= "Z")) {
      let ident = "";
      while (
        pos < source.length &&
        ((peek() >= "a" && peek() <= "z") ||
          (peek() >= "A" && peek() <= "Z") ||
          (peek() >= "0" && peek() <= "9"))
      ) {
        ident += advance();
      }
      const upper = ident.toUpperCase();

      // Check for $ suffix → string identifier
      if (pos < source.length && peek() === "$") {
        advance(); // consume $
        tokens.push({ type: TokenType.STRING_IDENT, value: upper + "$", line, column: startColumn });
        continue;
      }

      // Check for keyword
      const kwType = KEYWORDS.get(upper);
      if (kwType !== undefined) {
        // REM: consume rest of line
        if (kwType === TokenType.REM) {
          let comment = "";
          while (pos < source.length && peek() !== "\n" && peek() !== "\r") {
            comment += advance();
          }
          tokens.push({ type: TokenType.REM, value: "REM" + comment, line, column: startColumn });
        } else {
          tokens.push({ type: kwType, value: upper, line, column: startColumn });
        }
        continue;
      }

      // Regular identifier
      tokens.push({ type: TokenType.IDENTIFIER, value: upper, line, column: startColumn });
      continue;
    }

    // Two-character operators
    if (ch === "<") {
      advance();
      if (peek() === ">") {
        advance();
        tokens.push({ type: TokenType.NOT_EQUALS, value: "<>", line, column: startColumn });
      } else if (peek() === "=") {
        advance();
        tokens.push({ type: TokenType.LESS_EQUALS, value: "<=", line, column: startColumn });
      } else {
        tokens.push({ type: TokenType.LESS, value: "<", line, column: startColumn });
      }
      continue;
    }

    if (ch === ">") {
      advance();
      if (peek() === "=") {
        advance();
        tokens.push({ type: TokenType.GREATER_EQUALS, value: ">=", line, column: startColumn });
      } else {
        tokens.push({ type: TokenType.GREATER, value: ">", line, column: startColumn });
      }
      continue;
    }

    // Single-character operators and delimiters
    advance();
    switch (ch) {
      case "+":
        tokens.push({ type: TokenType.PLUS, value: "+", line, column: startColumn });
        break;
      case "-":
        tokens.push({ type: TokenType.MINUS, value: "-", line, column: startColumn });
        break;
      case "*":
        tokens.push({ type: TokenType.STAR, value: "*", line, column: startColumn });
        break;
      case "/":
        tokens.push({ type: TokenType.SLASH, value: "/", line, column: startColumn });
        break;
      case "=":
        tokens.push({ type: TokenType.EQUALS, value: "=", line, column: startColumn });
        break;
      case "(":
        tokens.push({ type: TokenType.LPAREN, value: "(", line, column: startColumn });
        break;
      case ")":
        tokens.push({ type: TokenType.RPAREN, value: ")", line, column: startColumn });
        break;
      case ",":
        tokens.push({ type: TokenType.COMMA, value: ",", line, column: startColumn });
        break;
      case ":":
        tokens.push({ type: TokenType.COLON, value: ":", line, column: startColumn });
        break;
      case ";":
        tokens.push({ type: TokenType.SEMICOLON, value: ";", line, column: startColumn });
        break;
      default:
        throw new LexError(`Unexpected character: ${ch}`, line);
    }
  }

  tokens.push({ type: TokenType.EOF, value: "", line, column });
  return tokens;
}
