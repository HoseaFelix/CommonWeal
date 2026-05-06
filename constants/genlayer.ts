import { defineChain } from 'viem';

export const genlayer = defineChain({
  id: 62255,
  name: 'GenLayer Studio',
  network: 'genlayer-studio',
  nativeCurrency: {
    decimals: 18,
    name: 'GEN',
    symbol: 'GEN',
  },
  rpcUrls: {
    default: {
      http: ['https://studio.genlayer.com/api'],
    },
  },
  blockExplorers: {
    default: { name: 'GenLayer Studio', url: 'https://studio.genlayer.com' },
  },
  testnet: true,
});