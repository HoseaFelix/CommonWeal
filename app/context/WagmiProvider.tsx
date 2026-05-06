"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createConfig, http, WagmiProvider as WagmiProviderCore } from 'wagmi';
import { genlayer } from '../../constants/genlayer';

const config = createConfig({
  chains: [genlayer],
  transports: {
    [genlayer.id]: http(),
  },
});

export function WagmiProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProviderCore config={config}>
        {children}
      </WagmiProviderCore>
    </QueryClientProvider>
  );
}
