import styled from "styled-components";

interface ViewSwitcherProps {
  mode: "table" | "grid";
  onChange: (mode: "table" | "grid") => void;
}

export const ViewSwitcher = ({ mode, onChange }: ViewSwitcherProps) => {
  return (
    <Container>
      <Button
        onClick={() => onChange("table")}
        $active={mode === "table"}
        aria-label="Table view"
        title="Table view"
      >
        <TableIcon />
      </Button>
      <Button
        onClick={() => onChange("grid")}
        $active={mode === "grid"}
        aria-label="Grid view"
        title="Grid view"
      >
        <GridIcon />
      </Button>
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  gap: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 0.25rem;
  background: white;
`;

const Button = styled.button<{ $active: boolean }>`
  padding: 0.5rem;
  background: ${(props) => (props.$active ? "#1a73e8" : "transparent")};
  color: ${(props) => (props.$active ? "white" : "#666")};
  border: none;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;

  &:hover {
    background: ${(props) => (props.$active ? "#1557b0" : "#f5f5f5")};
  }

  svg {
    width: 20px;
    height: 20px;
  }
`;

const TableIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M3 3h18v18H3V3zm2 2v3h14V5H5zm0 5v4h14v-4H5zm0 6v3h14v-3H5z" />
  </svg>
);

const GridIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M3 3h8v8H3V3zm10 0h8v8h-8V3zM3 13h8v8H3v-8zm10 0h8v8h-8v-8z" />
  </svg>
);
