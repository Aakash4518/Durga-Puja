import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Laxman Chhapra Mela | Durga Puja & Festival Memories",
    template: "%s | Laxman Chhapra Mela",
  },
  description:
    "Explore Durga Puja, local food stalls, cultural events, and festival memories from Laxman Chhapra, Bairia, Ballia, Uttar Pradesh.",
  applicationName: "Laxman Chhapra Mela",
  openGraph: {
    title: "Laxman Chhapra Mela",
    description: "Celebrating faith, tradition, and our village community.",
    type: "website",
    locale: "en_IN",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
