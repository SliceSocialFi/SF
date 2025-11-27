import type { ReactNode } from "react";
import { HelmetProvider } from "react-helmet-async";
import { ApolloProvider } from "@apollo/client";
import { createApolloClient } from "@slice/indexer/apollo/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ErrorBoundary from "@/components/Common/ErrorBoundary";
import authLink from "@/helpers/authLink";
import { ThemeProvider } from "@/hooks/useTheme";
import { ThemePaletteProvider } from "@/components/Shared/Theme/useThemePalette";
import { DNPAYSuperAppProvider } from "./DNPAYSuperAppProvider";
import Web3Provider from "./Web3Provider";

export const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false } }
});

const lensApolloClient = createApolloClient(authLink);

interface ProvidersProps {
  children: ReactNode;
}

const Providers = ({ children }: ProvidersProps) => {
  return (
    <ErrorBoundary>
      <DNPAYSuperAppProvider>
        <QueryClientProvider client={queryClient}>
          <Web3Provider>
            <ApolloProvider client={lensApolloClient}>
              <HelmetProvider>
                <ThemeProvider>
                  <ThemePaletteProvider>
                    {children}
                  </ThemePaletteProvider>
                </ThemeProvider>
              </HelmetProvider>
            </ApolloProvider>
          </Web3Provider>
        </QueryClientProvider>
      </DNPAYSuperAppProvider>
    </ErrorBoundary>
  );
};

export default Providers;
