import { RuntimeError } from "./errors.js";

export function callBuiltin(
  name: string,
  args: (number | string)[],
  line: number,
): number | string {
  switch (name) {
    case "INT":
      requireArgs(name, args, 1, line);
      requireNumber(name, args[0], line);
      return Math.floor(args[0] as number);

    case "RND":
      requireArgs(name, args, 1, line);
      return Math.random();

    case "ABS":
      requireArgs(name, args, 1, line);
      requireNumber(name, args[0], line);
      return Math.abs(args[0] as number);

    case "LEN":
      requireArgs(name, args, 1, line);
      requireString(name, args[0], line);
      return (args[0] as string).length;

    case "LEFT$":
      requireArgs(name, args, 2, line);
      requireString(name, args[0], line);
      requireNumber(name, args[1], line);
      return (args[0] as string).substring(0, args[1] as number);

    case "RIGHT$":
      requireArgs(name, args, 2, line);
      requireString(name, args[0], line);
      requireNumber(name, args[1], line);
      return (args[0] as string).slice(-(args[1] as number));

    case "MID$":
      requireArgs(name, args, 3, line);
      requireString(name, args[0], line);
      requireNumber(name, args[1], line);
      requireNumber(name, args[2], line);
      // BASIC MID$ is 1-based
      return (args[0] as string).substring(
        (args[1] as number) - 1,
        (args[1] as number) - 1 + (args[2] as number),
      );

    case "STR$":
      requireArgs(name, args, 1, line);
      requireNumber(name, args[0], line);
      return String(args[0]);

    case "VAL":
      requireArgs(name, args, 1, line);
      requireString(name, args[0], line);
      return parseFloat(args[0] as string) || 0;

    case "CHR$":
      requireArgs(name, args, 1, line);
      requireNumber(name, args[0], line);
      return String.fromCharCode(args[0] as number);

    case "ASC":
      requireArgs(name, args, 1, line);
      requireString(name, args[0], line);
      if ((args[0] as string).length === 0) {
        throw new RuntimeError("ASC requires a non-empty string", line);
      }
      return (args[0] as string).charCodeAt(0);

    default:
      throw new RuntimeError(`Unknown function: ${name}`, line);
  }
}

function requireArgs(
  name: string,
  args: unknown[],
  count: number,
  line: number,
): void {
  if (args.length !== count) {
    throw new RuntimeError(
      `${name} requires ${count} argument(s), got ${args.length}`,
      line,
    );
  }
}

function requireNumber(name: string, value: unknown, line: number): void {
  if (typeof value !== "number") {
    throw new RuntimeError(`${name} requires a numeric argument`, line);
  }
}

function requireString(name: string, value: unknown, line: number): void {
  if (typeof value !== "string") {
    throw new RuntimeError(`${name} requires a string argument`, line);
  }
}
