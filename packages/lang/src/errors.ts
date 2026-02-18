export class MiniBasicError extends Error {
  line?: number;

  constructor(message: string, line?: number) {
    super(message);
    this.name = "MiniBasicError";
    this.line = line;
  }
}

export class LexError extends MiniBasicError {
  constructor(message: string, line?: number) {
    super(message, line);
    this.name = "LexError";
  }
}

export class ParseError extends MiniBasicError {
  constructor(message: string, line?: number) {
    super(message, line);
    this.name = "ParseError";
  }
}

export class RuntimeError extends MiniBasicError {
  constructor(message: string, line?: number) {
    super(message, line);
    this.name = "RuntimeError";
  }
}
