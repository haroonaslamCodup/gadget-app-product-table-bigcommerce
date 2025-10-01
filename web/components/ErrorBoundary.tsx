import { Component, ReactNode, ErrorInfo } from "react";
import styled from "styled-components";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(_error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <ErrorContainer>
          <ErrorCard>
            <ErrorIcon>⚠</ErrorIcon>
            <ErrorTitle>Something went wrong</ErrorTitle>
            <ErrorMessage>
              We're sorry, but something unexpected happened. Please try refreshing the page.
            </ErrorMessage>
            {process.env.NODE_ENV === "development" && this.state.error && (
              <ErrorDetails>
                <ErrorDetailsTitle>Error Details (Development Only)</ErrorDetailsTitle>
                <ErrorStack>{this.state.error.toString()}</ErrorStack>
                {this.state.errorInfo && (
                  <ErrorStack>{this.state.errorInfo.componentStack}</ErrorStack>
                )}
              </ErrorDetails>
            )}
            <ButtonGroup>
              <ResetButton onClick={this.handleReset}>Try Again</ResetButton>
              <RefreshButton onClick={() => window.location.reload()}>
                Refresh Page
              </RefreshButton>
            </ButtonGroup>
          </ErrorCard>
        </ErrorContainer>
      );
    }

    return this.props.children;
  }
}

const ErrorContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  padding: 2rem;
`;

const ErrorCard = styled.div`
  max-width: 600px;
  background: white;
  border: 1px solid #ffcdd2;
  border-radius: 8px;
  padding: 2rem;
  text-align: center;
`;

const ErrorIcon = styled.div`
  font-size: 4rem;
  color: #f44336;
  margin-bottom: 1rem;
`;

const ErrorTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  color: #333;
  margin: 0 0 1rem 0;
`;

const ErrorMessage = styled.p`
  font-size: 1rem;
  color: #666;
  margin: 0 0 1.5rem 0;
  line-height: 1.5;
`;

const ErrorDetails = styled.div`
  margin-top: 1.5rem;
  padding: 1rem;
  background: #f5f5f5;
  border-radius: 4px;
  text-align: left;
`;

const ErrorDetailsTitle = styled.h3`
  font-size: 0.875rem;
  font-weight: 600;
  color: #666;
  margin: 0 0 0.5rem 0;
`;

const ErrorStack = styled.pre`
  font-size: 0.75rem;
  color: #c33;
  overflow-x: auto;
  white-space: pre-wrap;
  word-wrap: break-word;
  margin: 0.5rem 0;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 1.5rem;
`;

const ResetButton = styled.button`
  padding: 0.75rem 1.5rem;
  background: #1a73e8;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #1557b0;
  }
`;

const RefreshButton = styled.button`
  padding: 0.75rem 1.5rem;
  background: white;
  color: #1a73e8;
  border: 1px solid #1a73e8;
  border-radius: 4px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #f5f5f5;
  }
`;
