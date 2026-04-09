import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/auth/AuthContext";
import { SymbolProvider } from "@/context/SymbolContext";
import { PortfolioProvider } from "@/context/PortfolioContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NexTrade - Indian Market Trading & Investment Platform",
  description: "A powerful and intuitive trading platform for Indian markets (NSE-focused)",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <PortfolioProvider>
            <SymbolProvider>{children}</SymbolProvider>
          </PortfolioProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
