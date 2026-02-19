import { useCallback } from "react";

interface EditorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const editorStyle: React.CSSProperties = {
  width: "100%",
  height: "100%",
  padding: "12px",
  fontFamily: "'Courier New', Courier, monospace",
  fontSize: "14px",
  lineHeight: "1.5",
  backgroundColor: "#1e1e1e",
  color: "#d4d4d4",
  border: "none",
  outline: "none",
  resize: "none",
  overflow: "auto",
};

export function Editor({ value, onChange, disabled }: EditorProps) {
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Tab") {
        e.preventDefault();
        const target = e.currentTarget;
        const start = target.selectionStart;
        const end = target.selectionEnd;
        const newValue = value.substring(0, start) + "  " + value.substring(end);
        onChange(newValue);
        // Set cursor position after React re-renders
        requestAnimationFrame(() => {
          target.selectionStart = target.selectionEnd = start + 2;
        });
      }
    },
    [value, onChange]
  );

  return (
    <textarea
      style={editorStyle}
      value={value}
      onChange={e => onChange(e.target.value)}
      onKeyDown={handleKeyDown}
      disabled={disabled}
      placeholder="Enter your BASIC program here..."
      spellCheck={false}
      autoCorrect="off"
      autoCapitalize="off"
    />
  );
}
