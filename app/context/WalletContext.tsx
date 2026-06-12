"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { genlayer } from '../../constants/genlayer';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';

const GENLAYER_STUDIO_NETWORK = {
    chainId: `0x${genlayer.id.toString(16)}`,
    chainName: genlayer.name,
    rpcUrls: genlayer.rpcUrls.default.http,
    nativeCurrency: {
        name: genlayer.nativeCurrency.name,
        symbol: genlayer.nativeCurrency.symbol,
        decimals: genlayer.nativeCurrency.decimals
    },
    blockExplorerUrls: genlayer.blockExplorers?.default?.url
        ? [genlayer.blockExplorers.default.url]
        : undefined,
};

type WalletType = 'auto' | 'metamask' | null;

interface Account {
    address: string;
    privateKey?: string;
    type?: WalletType;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any; // Allow other props from genlayer-js
}

interface WalletContextType {
    account: Account | null;
    isConnected: boolean;
    walletType: WalletType;
    error: string | null;
    connectMetaMask: () => Promise<boolean>;
    connectWalletConnect: () => Promise<boolean>;
    disconnect: () => void;
}

const WalletContext = createContext<WalletContextType | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
    const [account, setAccount] = useState<Account | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [walletType, setWalletType] = useState<WalletType>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        connectAutoAccount();
    }, []);

    const connectAutoAccount = () => {
        try {
            // Generate valid private key using viem
            const pKey = generatePrivateKey();
            const account = privateKeyToAccount(pKey);

            console.log('Debug: Auto account generated:', {
                address: account.address,
                keyLen: pKey.length
            });

            setAccount({
                address: account.address,
                privateKey: pKey,
                type: 'auto'
            });

            setIsConnected(true);
            setWalletType('auto');
            setError(null);
        } catch (err) {
            console.error('Failed to create auto account:', err);
        }
    };

    const switchToGenLayerNetwork = async () => {
        if (!window.ethereum) return false;
        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: GENLAYER_STUDIO_NETWORK.chainId }],
            });
            return true;
        } catch (switchError: unknown) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const error = switchError as any;
            if (error.code === 4902) {
                try {
                    await window.ethereum.request({
                        method: 'wallet_addEthereumChain',
                        params: [GENLAYER_STUDIO_NETWORK],
                    });
                    return true;
                } catch (addError) {
                    console.error('Failed to add GenLayer network:', addError);
                    return false;
                }
            }
            console.error('Failed to switch network:', switchError);
            return false;
        }
    };

    const connectMetaMask = async () => {
        try {
            if (!window.ethereum) {
                setError('MetaMask not installed');
                return false;
            }

            // First, switch to GenLayer network
            const networkSwitched = await switchToGenLayerNetwork();
            if (!networkSwitched) {
                setError('Please switch to GenLayer Studio network in MetaMask');
                return false;
            }

            // Request account access
            const accounts = await window.ethereum.request({
                method: 'eth_requestAccounts'
            });

            if (accounts && Array.isArray(accounts) && accounts.length > 0) {
                const metaMaskAccount = {
                    address: accounts[0],
                    type: 'metamask' as const
                };

                setAccount(metaMaskAccount);
                setIsConnected(true);
                setWalletType('metamask');
                setError(null);
                return true;
            }
            return false;
        } catch (err: unknown) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const error = err as any;
            console.error('MetaMask connection error:', err);
            setError(error.message || 'Failed to connect MetaMask');
            return false;
        }
    };

    const connectWalletConnect = async () => {
        setError('WalletConnect integration coming soon');
        return false;
    };

    const disconnect = () => {
        setAccount(null);
        setIsConnected(false);
        setWalletType(null);
        setError(null);

        // Reconnect auto account after disconnect
        setTimeout(() => {
            connectAutoAccount();
        }, 100);
    };

    const value = {
        account,
        isConnected,
        walletType,
        error,
        connectMetaMask,
        connectWalletConnect,
        disconnect,
    };

    return (
        <WalletContext.Provider value={value}>
            {children}
        </WalletContext.Provider>
    );
}

export function useWallet() {
    const context = useContext(WalletContext);
    if (!context) {
        throw new Error('useWallet must be used within WalletProvider');
    }
    return context;
}
