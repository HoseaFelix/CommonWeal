import type { Metadata } from "next";
import { Fraunces, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { WalletProvider } from "./context/WalletContext";
import { WagmiProvider } from "./context/WagmiProvider";

const displayFont = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
});

const bodyFont = Space_Grotesk({
  variable: "--font-body",
  subsets: ["latin"],
});

const monoFont = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Policy Risk Analyzer - GenLayer Consensus",
  description: "Assess policy and terms language with GenLayer's decentralized AI consensus. Structured risk scores, clause detection, and compliance flags.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme='dark'>
      <body className={`${displayFont.variable} ${bodyFont.variable} ${monoFont.variable} antialiased font-body bg-bg-dark text-text-main`}>
        <WagmiProvider>
          <WalletProvider>
            {children}
          </WalletProvider>
        </WagmiProvider>
      </body>
    </html>
  );
}
