import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "vintedplug — Twoja sprzedaż pod kontrolą",
  description: "Konta, ogłoszenia, finanse i narzędzia do sprzedaży rzeczy z drugiej ręki.",
  icons: {
    icon: [
      {url:"/brand/vintedplug-icon-32.png",sizes:"32x32",type:"image/png"},
      {url:"/brand/vintedplug-icon-192.png",sizes:"192x192",type:"image/png"},
      {url:"/favicon.ico",sizes:"any"},
    ],
    shortcut: "/favicon.ico",
    apple: [{url:"/apple-touch-icon.png",sizes:"180x180",type:"image/png"}],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl">
      <body className="antialiased">{children}</body>
    </html>
  );
}
