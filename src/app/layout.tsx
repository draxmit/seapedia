import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
});

export const metadata: Metadata = {
  title: {
    default: "SEAPEDIA — Marketplace Serba Ada",
    template: "%s · SEAPEDIA",
  },
  description:
    "SEAPEDIA adalah marketplace yang mempertemukan penjual, pembeli, dan driver dalam satu ekosistem belanja online.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" className={jakarta.variable}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
