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
        className="secondary-btn gap-3 border border-edge/80 shadow-[0_10px_20px_rgba(47,35,26,0.06)]"
      >
        <span className={`h-2.5 w-2.5 rounded-full ${walletType === 'auto' ? 'bg-accent-tertiary' : 'bg-success'}`} />
        <span className="text-sm">
          {walletType === 'auto' ? 'Studio Wallet' : 'MetaMask'}
        </span>
        <span className="font-mono text-xs text-text-muted">{formatAddress(account.address)}</span>
      </button>

      {showMenu && (
        <div className="absolute right-0 z-50 mt-2 w-56 rounded-[1.4rem] border border-edge bg-panel p-2 shadow-[0_18px_35px_rgba(47,35,26,0.14)]">
          <div className="px-3 py-2 text-xs uppercase tracking-[0.2em] text-text-muted">
            {walletType === 'auto' ? 'Ephemeral Session' : 'Connected Wallet'}
          </div>
          {walletType === 'auto' && (
            <button
              onClick={async () => {
                setShowMenu(false);
                await connectMetaMask();
              }}
              className="w-full rounded-xl px-3 py-2 text-left text-sm text-text-main hover:bg-white/70"
            >
              Switch to MetaMask
            </button>
          )}
          <button
            onClick={() => {
              setShowMenu(false);
              disconnect();
            }}
            className="w-full rounded-xl px-3 py-2 text-left text-sm text-destructive hover:bg-white/70"
          >
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
};
