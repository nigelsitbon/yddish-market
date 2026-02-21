import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { frFR } from "@clerk/localizations";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "YDDISH MARKET | Marketplace Judaica Premium",
    template: "%s | YDDISH MARKET",
  },
  description:
    "La marketplace de reference pour les objets Judaica : objets rituels, bijoux, art, mode, mezouzot, livres et alimentaire casher. Artisans verifies, paiement securise.",
  keywords: [
    "judaica",
    "marketplace",
    "objets rituels",
    "bijoux juifs",
    "mezouzot",
    "casher",
    "shabbat",
    "art juif",
  ],
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: "YDDISH MARKET",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider localization={frFR}>
      <html lang="fr">
        <body className={`${inter.variable} font-sans antialiased`}>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
