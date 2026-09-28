import type { Metadata, Viewport } from "next";
import { Baloo_2 } from "next/font/google";
import { GameProvider } from "@/context/GameContext";
import "./globals.css";

const baloo = Baloo_2({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "¿Quién es más probable que...?",
  description:
    "Un juego de fiesta para dos jugadores: descubrid cuánto os conocéis.",
  openGraph: {
    title: "¿Quién es más probable que...?",
    description:
      "Un juego de fiesta para dos jugadores: descubrid cuánto os conocéis.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#ff6b81",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${baloo.variable} font-display antialiased`}>
        <GameProvider>{children}</GameProvider>
      </body>
    </html>
  );
}
