export enum TokenType {
  // Literals
  NUMBER = "NUMBER",
  STRING = "STRING",
  IDENTIFIER = "IDENTIFIER",
  STRING_IDENT = "STRING_IDENT",

  // Keywords
  LET = "LET",
  PRINT = "PRINT",
  IF = "IF",
  THEN = "THEN",
  ELSE = "ELSE",
  GOTO = "GOTO",
  FOR = "FOR",
  TO = "TO",
  NEXT = "NEXT",
  STEP = "STEP",
  GOSUB = "GOSUB",
  RETURN = "RETURN",
  INPUT = "INPUT",
  END = "END",
  REM = "REM",
  MOD = "MOD",
  AND = "AND",
  OR = "OR",
  NOT = "NOT",

  // Operators
  PLUS = "PLUS",
  MINUS = "MINUS",
  STAR = "STAR",
  SLASH = "SLASH",
  EQUALS = "EQUALS",
  NOT_EQUALS = "NOT_EQUALS",
  LESS = "LESS",
  GREATER = "GREATER",
  LESS_EQUALS = "LESS_EQUALS",
  GREATER_EQUALS = "GREATER_EQUALS",

  // Delimiters
  LPAREN = "LPAREN",
  RPAREN = "RPAREN",
  COMMA = "COMMA",
  COLON = "COLON",
  SEMICOLON = "SEMICOLON",

  // End of file
  EOF = "EOF",
}

export interface Token {
  type: TokenType;
  value: string;
  line: number;
  column: number;
}

export const KEYWORDS: ReadonlyMap<string, TokenType> = new Map([
  ["LET", TokenType.LET],
  ["PRINT", TokenType.PRINT],
  ["IF", TokenType.IF],
  ["THEN", TokenType.THEN],
  ["ELSE", TokenType.ELSE],
  ["GOTO", TokenType.GOTO],
  ["FOR", TokenType.FOR],
  ["TO", TokenType.TO],
  ["NEXT", TokenType.NEXT],
  ["STEP", TokenType.STEP],
  ["GOSUB", TokenType.GOSUB],
  ["RETURN", TokenType.RETURN],
  ["INPUT", TokenType.INPUT],
  ["END", TokenType.END],
  ["REM", TokenType.REM],
  ["MOD", TokenType.MOD],
  ["AND", TokenType.AND],
  ["OR", TokenType.OR],
  ["NOT", TokenType.NOT],
]);
