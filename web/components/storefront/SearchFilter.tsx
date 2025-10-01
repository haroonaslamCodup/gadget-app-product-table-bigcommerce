import { useState, useEffect } from "react";
import styled from "styled-components";

interface SearchFilterProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const SearchFilter = ({
  value,
  onChange,
  placeholder = "Search products...",
}: SearchFilterProps) => {
  const [localValue, setLocalValue] = useState(value);

  // Debounce the search input
  useEffect(() => {
    const timer = setTimeout(() => {
      onChange(localValue);
    }, 300);

    return () => clearTimeout(timer);
  }, [localValue, onChange]);

  const handleClear = () => {
    setLocalValue("");
    onChange("");
  };

  return (
    <Container>
      <SearchIcon />
      <Input
        type="text"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        placeholder={placeholder}
      />
      {localValue && <ClearButton onClick={handleClear}>×</ClearButton>}
    </Container>
  );
};

const Container = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  flex: 1;
  max-width: 400px;

  @media (max-width: 768px) {
    max-width: 100%;
  }
`;

const SearchIcon = () => (
  <IconWrapper>
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <circle cx="11" cy="11" r="8" strokeWidth="2" />
      <path d="M21 21l-4.35-4.35" strokeWidth="2" strokeLinecap="round" />
    </svg>
  </IconWrapper>
);

const IconWrapper = styled.div`
  position: absolute;
  left: 1rem;
  color: #666;
  display: flex;
  align-items: center;
  pointer-events: none;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 3rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.875rem;
  transition: all 0.2s;

  &:focus {
    outline: none;
    border-color: #1a73e8;
    box-shadow: 0 0 0 3px rgba(26, 115, 232, 0.1);
  }

  &::placeholder {
    color: #999;
  }

  @media (max-width: 768px) {
    font-size: 1rem;
  }
`;

const ClearButton = styled.button`
  position: absolute;
  right: 0.75rem;
  width: 24px;
  height: 24px;
  border: none;
  background: #e0e0e0;
  color: #666;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  line-height: 1;
  transition: all 0.2s;

  &:hover {
    background: #d0d0d0;
    color: #333;
  }
`;
