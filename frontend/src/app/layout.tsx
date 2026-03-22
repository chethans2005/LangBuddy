import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "flag-icons/css/flag-icons.min.css";
import AuthProvider from "@/components/AuthProvider";
import ThemeProvider from "@/components/ThemeProvider";
import { GoogleOAuthProvider } from "@react-oauth/google";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "LangBuddy - Multilingual Friendship Platform",
  description: "Connect and learn languages with friends across the globe.",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
};

const GOOGLE_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "dummy_client_id_for_now.apps.googleusercontent.com";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} antialiased`}>
        <GoogleOAuthProvider clientId={GOOGLE_ID}>
          <ThemeProvider>
            <AuthProvider>{children}</AuthProvider>
          </ThemeProvider>
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}
