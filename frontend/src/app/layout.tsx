import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AuthProvider from "@/components/AuthProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "LangBuddy - Multilingual Friendship Platform",
  description: "Connect and learn languages with friends across the globe.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased bg-[#09090b] text-zinc-50`}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
