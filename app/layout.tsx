import type { Metadata } from "next";
import "./globals.css";
import { WalletProvider } from "./context/WalletContext";
import { WagmiProvider } from "./context/WagmiProvider";

export const metadata: Metadata = {
  title: "VendorLens - GenLayer Due Diligence Workspace",
  description: "Review vendors, compare procurement readiness, benchmark against trust frameworks, and generate due diligence reports with GenLayer consensus.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased font-body bg-bg text-text-main">
        <WagmiProvider>
          <WalletProvider>
            {children}
          </WalletProvider>
        </WagmiProvider>
      </body>
    </html>
  );
}
