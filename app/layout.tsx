import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/Header";

export const metadata: Metadata = {
  title: "HarvciousHacks — Premium Tools",
  description: "Download premium hacks and tools. Curated EXE releases with full feature breakdowns.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-body min-h-screen">
        <Header />
        <main>{children}</main>
      </body>
    </html>
  );
}
