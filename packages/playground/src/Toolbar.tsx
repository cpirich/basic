interface ToolbarProps {
  running: boolean;
  onRun: () => void;
  onStop: () => void;
  onSelectExample: (source: string) => void;
  examples: Array<{ name: string; source: string }>;
}

const toolbarStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "8px 16px",
  backgroundColor: "#252526",
  borderBottom: "1px solid #333",
  height: "48px",
  flexShrink: 0,
};

const titleStyle: React.CSSProperties = {
  fontSize: "18px",
  fontWeight: "bold",
  color: "#569cd6",
  fontFamily: "'Courier New', Courier, monospace",
};

const controlsStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
};

const buttonBase: React.CSSProperties = {
  padding: "6px 16px",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer",
  fontSize: "14px",
  fontWeight: "bold",
  color: "#fff",
};

const selectStyle: React.CSSProperties = {
  padding: "6px 8px",
  backgroundColor: "#3c3c3c",
  color: "#d4d4d4",
  border: "1px solid #555",
  borderRadius: "4px",
  fontSize: "13px",
  cursor: "pointer",
};

export function Toolbar({ running, onRun, onStop, onSelectExample, examples }: ToolbarProps) {
  return (
    <div style={toolbarStyle}>
      <span style={titleStyle}>MiniBasic</span>
      <div style={controlsStyle}>
        <select
          style={selectStyle}
          onChange={e => {
            const idx = parseInt(e.target.value, 10);
            if (!isNaN(idx) && examples[idx]) {
              onSelectExample(examples[idx].source);
            }
          }}
          defaultValue=""
        >
          <option value="" disabled>
            -- Load Example --
          </option>
          {examples.map((ex, i) => (
            <option key={i} value={i}>
              {ex.name}
            </option>
          ))}
        </select>
        {running ? (
          <button
            style={{ ...buttonBase, backgroundColor: "#d32f2f" }}
            onClick={onStop}
          >
            ■ Stop
          </button>
        ) : (
          <button
            style={{ ...buttonBase, backgroundColor: "#388e3c" }}
            onClick={onRun}
          >
            ▶ Run
          </button>
        )}
      </div>
    </div>
  );
}
