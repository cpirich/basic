import { useState, useCallback } from "react";
import { useInterpreter } from "./useInterpreter";
import { Editor } from "./Editor";
import { Console } from "./Console";
import { Toolbar } from "./Toolbar";
import { examples } from "./examples";

const appStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  height: "100vh",
};

const mainStyle: React.CSSProperties = {
  display: "flex",
  flex: 1,
  minHeight: 0,
};

const paneStyle: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
};

const dividerStyle: React.CSSProperties = {
  width: "2px",
  backgroundColor: "#333",
  flexShrink: 0,
};

export function App() {
  const [source, setSource] = useState(examples[0]?.source ?? "");
  const { state, run, stop, submitInput } = useInterpreter();

  const handleRun = useCallback(() => {
    run(source);
  }, [run, source]);

  const handleSelectExample = useCallback(
    (exampleSource: string) => {
      setSource(exampleSource);
    },
    []
  );

  return (
    <div style={appStyle}>
      <Toolbar
        running={state.running}
        onRun={handleRun}
        onStop={stop}
        onSelectExample={handleSelectExample}
        examples={examples}
      />
      <div style={mainStyle}>
        <div style={paneStyle}>
          <Editor
            value={source}
            onChange={setSource}
            disabled={state.running}
          />
        </div>
        <div style={dividerStyle} />
        <div style={paneStyle}>
          <Console
            output={state.output}
            waitingForInput={state.waitingForInput}
            inputPrompt={state.inputPrompt}
            onSubmitInput={submitInput}
          />
        </div>
      </div>
    </div>
  );
}
