import { GlobalStyles } from '@bigcommerce/big-design';
import { theme as defaultTheme } from '@bigcommerce/big-design-theme';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import React from "react";
import ReactDOM from "react-dom/client";
import { createGlobalStyle, ThemeProvider } from 'styled-components';
import App from "./components/App";

const root = document.getElementById("root");
if (!root) throw new Error("#root element not found for booting react app");

const AppGlobalStyles = createGlobalStyle`
  body {
    height: 100%;
    background-color: ${({ theme }) => (theme && theme.colors && theme.colors.secondary10) ? theme.colors.secondary10 : '#f5f7f9'}
  }
`

// Configure TanStack Query client with optimized defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,        // 5 minutes - data stays fresh
      gcTime: 1000 * 60 * 30,          // 30 minutes - garbage collection time (formerly cacheTime)
      refetchOnWindowFocus: false,     // Disable auto-refetch on window focus
      retry: 1,                        // Retry failed requests once
      refetchOnMount: true,            // Refetch on component mount if stale
    },
    mutations: {
      retry: 0,                        // Don't retry mutations by default
    }
  },
});

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={defaultTheme}>
        <>
          <AppGlobalStyles />
          <GlobalStyles />
          <App />
        </>
      </ThemeProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </React.StrictMode>
);
