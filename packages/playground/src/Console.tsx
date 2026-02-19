import { useState, useEffect, useRef, useCallback } from "react";

interface ConsoleProps {
  output: string[];
  waitingForInput: boolean;
  inputPrompt: string;
  onSubmitInput: (value: string) => void;
}

const containerStyle: React.CSSProperties = {
  width: "100%",
  height: "100%",
  padding: "12px",
  fontFamily: "'Courier New', Courier, monospace",
  fontSize: "14px",
  lineHeight: "1.5",
  backgroundColor: "#0c0c0c",
  color: "#33ff33",
  overflowY: "auto",
  display: "flex",
  flexDirection: "column",
};

const outputLineStyle: React.CSSProperties = {
  whiteSpace: "pre-wrap",
  margin: 0,
};

const inputRowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "4px",
  marginTop: "2px",
};

const inputStyle: React.CSSProperties = {
  flex: 1,
  backgroundColor: "transparent",
  border: "none",
  borderBottom: "1px solid #33ff33",
  outline: "none",
  color: "#33ff33",
  fontFamily: "'Courier New', Courier, monospace",
  fontSize: "14px",
  padding: "2px 0",
};

export function Console({ output, waitingForInput, inputPrompt, onSubmitInput }: ConsoleProps) {
  const [inputValue, setInputValue] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when output changes
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [output, waitingForInput]);

  // Auto-focus input when waiting for input
  useEffect(() => {
    if (waitingForInput && inputRef.current) {
      inputRef.current.focus();
    }
  }, [waitingForInput]);

  const handleSubmit = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        onSubmitInput(inputValue);
        setInputValue("");
      }
    },
    [inputValue, onSubmitInput]
  );

  return (
    <div ref={containerRef} style={containerStyle}>
      <div style={{ flex: 1 }}>
        {output.map((line, i) => (
          <div key={i} style={outputLineStyle}>
            {line}
          </div>
        ))}
        {waitingForInput && (
          <div style={inputRowStyle}>
            <span>{inputPrompt}</span>
            <input
              ref={inputRef}
              style={inputStyle}
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={handleSubmit}
              autoFocus
            />
          </div>
        )}
      </div>
    </div>
  );
}
