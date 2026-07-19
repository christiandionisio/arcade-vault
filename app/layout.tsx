import type { Metadata } from "next";
import { Press_Start_2P, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import UserProvider from "@/components/UserProvider";
import Nav from "@/components/Nav";

const pressStart2P = Press_Start_2P({
  weight: "400",
  variable: "--font-pixel",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  weight: ["400", "500", "700"],
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Arcade Vault",
  description: "Online gaming platform where players compete for points",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${pressStart2P.variable} ${jetbrainsMono.variable} h-full`}
    >
      <body className="min-h-full flex flex-col">
        <div className="av-bg" />
        <div className="av-noise" />
        <UserProvider>
          <div id="root">
            <Nav />
            {children}
            <footer
              style={{
                borderTop: "1px solid var(--line)",
                padding: "20px 32px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "12px",
              }}
            >
              <span className="pixel" style={{ fontSize: "9px", color: "var(--ink-faint)", letterSpacing: "0.12em" }}>
                ARCADE VAULT © 2026
              </span>
              <span className="mono" style={{ fontSize: "11px", color: "var(--ink-faint)" }}>
                INSERT COIN TO CONTINUE_
              </span>
            </footer>
          </div>
        </UserProvider>
      </body>
    </html>
  );
}
