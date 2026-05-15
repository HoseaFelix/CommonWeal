import type { Metadata } from "next";
import "./globals.css";
import { WalletProvider } from "./context/WalletContext";
import { WagmiProvider } from "./context/WagmiProvider";

export const metadata: Metadata = {
  title: "Commonweal - GenLayer Grant Allocation Workspace",
  description: "Review grant applications, compare allocation readiness, benchmark proposals against funding rubrics, and generate capital release memos with GenLayer consensus.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-bg font-body text-ink-main">
        <WagmiProvider>
          <WalletProvider>
            {children}
          </WalletProvider>
        </WagmiProvider>
      </body>
    </html>
  );
}
