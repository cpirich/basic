import { useState, useRef, useCallback } from "react";
import { compile, createInterpreter, MiniBasicError } from "minibasic-lang";
import type { InterpreterEvent } from "minibasic-lang";

export interface InterpreterState {
  output: string[];
  running: boolean;
  waitingForInput: boolean;
  inputPrompt: string;
}

export function useInterpreter() {
  const [state, setState] = useState<InterpreterState>({
    output: [],
    running: false,
    waitingForInput: false,
    inputPrompt: "",
  });

  // Use refs for the generator and input resolver to avoid stale closures
  const generatorRef = useRef<AsyncGenerator<InterpreterEvent, void, string | undefined> | null>(null);
  const inputResolverRef = useRef<((value: string) => void) | null>(null);

  const stop = useCallback(() => {
    if (generatorRef.current) {
      generatorRef.current.return(undefined as never);
      generatorRef.current = null;
    }
    inputResolverRef.current = null;
    setState(s => ({ ...s, running: false, waitingForInput: false, inputPrompt: "" }));
  }, []);

  const run = useCallback((source: string) => {
    // Stop any previous execution
    if (generatorRef.current) {
      generatorRef.current.return(undefined as never);
      generatorRef.current = null;
      inputResolverRef.current = null;
    }

    setState({ output: [], running: true, waitingForInput: false, inputPrompt: "" });

    let program;
    try {
      program = compile(source);
    } catch (e) {
      const message = e instanceof MiniBasicError ? e.message : String(e);
      setState({ output: [`ERROR: ${message}`], running: false, waitingForInput: false, inputPrompt: "" });
      return;
    }

    const gen = createInterpreter(program);
    generatorRef.current = gen;

    (async () => {
      let result = await gen.next();
      while (!result.done) {
        // Check if this generator is still the current one (not stopped)
        if (generatorRef.current !== gen) return;

        const event = result.value;
        switch (event.type) {
          case "print":
            setState(s => ({ ...s, output: [...s.output, event.text] }));
            result = await gen.next();
            break;
          case "input": {
            setState(s => ({ ...s, waitingForInput: true, inputPrompt: event.prompt }));
            const input = await new Promise<string>(resolve => {
              inputResolverRef.current = resolve;
            });
            if (generatorRef.current !== gen) return;
            setState(s => ({ ...s, waitingForInput: false, inputPrompt: "" }));
            result = await gen.next(input);
            break;
          }
          case "error":
            setState(s => ({
              ...s,
              output: [...s.output, `ERROR: ${event.error.message}`],
              running: false,
              waitingForInput: false,
              inputPrompt: "",
            }));
            generatorRef.current = null;
            return;
          case "end":
            setState(s => ({ ...s, running: false, waitingForInput: false, inputPrompt: "" }));
            generatorRef.current = null;
            return;
        }
      }
      // Generator finished naturally
      if (generatorRef.current === gen) {
        setState(s => ({ ...s, running: false }));
        generatorRef.current = null;
      }
    })();
  }, []);

  const submitInput = useCallback((value: string) => {
    if (inputResolverRef.current) {
      inputResolverRef.current(value);
      inputResolverRef.current = null;
    }
  }, []);

  const clearOutput = useCallback(() => {
    setState(s => ({ ...s, output: [] }));
  }, []);

  return { state, run, stop, submitInput, clearOutput };
}
