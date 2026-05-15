"use client";
import React, { useState } from "react";
import { useWallet } from "../context/WalletContext";

export const WalletButton = () => {
  const { account, isConnected, walletType, connectMetaMask, disconnect } = useWallet();
  const [showMenu, setShowMenu] = useState(false);

  const formatAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  if (!isConnected || !account) {
    return (
      <button
        onClick={() => connectMetaMask()}
        className="secondary-btn"
      >
        Connect MetaMask
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="secondary-btn gap-3 shadow-[0_12px_24px_rgba(0,0,0,0.22)]"
      >
        <span className={`h-2.5 w-2.5 rounded-full ${walletType === 'auto' ? 'bg-accent-gold' : 'bg-success'}`} />
        <span className="text-[0.72rem] uppercase tracking-[0.16em]">
          {walletType === 'auto' ? 'Studio Wallet' : 'MetaMask'}
        </span>
        <span className="font-mono text-xs text-ink-dim">{formatAddress(account.address)}</span>
      </button>

      {showMenu && (
        <div className="absolute right-0 z-50 mt-2 w-60 rounded-[1.2rem] border border-white/10 bg-[rgba(8,15,28,0.96)] p-2 shadow-[0_18px_35px_rgba(0,0,0,0.34)] backdrop-blur-xl">
          <div className="px-3 py-2 text-[0.68rem] uppercase tracking-[0.22em] text-ink-dim">
            {walletType === 'auto' ? 'Ephemeral Session' : 'Connected Wallet'}
          </div>
          {walletType === 'auto' && (
            <button
              onClick={async () => {
                setShowMenu(false);
                await connectMetaMask();
              }}
              className="w-full rounded-xl px-3 py-2 text-left text-sm text-ink-main transition hover:bg-white/5"
            >
              Switch to MetaMask
            </button>
          )}
          <button
            onClick={() => {
              setShowMenu(false);
              disconnect();
            }}
            className="w-full rounded-xl px-3 py-2 text-left text-sm text-danger transition hover:bg-white/5"
          >
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
};
