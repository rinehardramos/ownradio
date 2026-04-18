import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OwnRadio",
  description: "Your Station. Your Vibe. Your Crowd.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full bg-brand-dark text-white">{children}</body>
    </html>
  );
}
