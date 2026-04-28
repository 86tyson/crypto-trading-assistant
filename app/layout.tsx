import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Crypto Trading Assistant",
  description: "Paper trading assistant - BTC/ETH mockup",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, background: "#0a0a0a", color: "#e0e0e0", fontFamily: "monospace, sans-serif", minHeight: "100vh" }}>
        {children}
      </body>
    </html>
  );
}