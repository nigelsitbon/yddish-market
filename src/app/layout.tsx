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
  metadataBase: new URL("https://yddishmarket.com"),
  title: {
    default: "YDDISH MARKET | Marketplace Judaica Premium",
    template: "%s | YDDISH MARKET",
  },
  description:
    "La marketplace de référence pour les objets Judaica : objets rituels, bijoux, art, mode, mezouzot, livres et alimentaire casher. Artisans vérifiés, paiement sécurisé.",
  keywords: [
    "judaica",
    "marketplace judaica",
    "objets rituels juifs",
    "bijoux juifs",
    "mezouzot",
    "casher",
    "shabbat",
    "art juif",
    "boutique juive en ligne",
    "cadeau juif",
    "menorah",
    "hanoukkia",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: "YDDISH MARKET",
    url: "https://yddishmarket.com",
    title: "YDDISH MARKET | Marketplace Judaica Premium",
    description:
      "Découvrez des objets Judaica d'exception : bijoux, art, mezouzot, livres et plus. Artisans vérifiés, livraison sécurisée.",
  },
  twitter: {
    card: "summary",
    title: "YDDISH MARKET | Marketplace Judaica Premium",
    description:
      "Découvrez des objets Judaica d'exception : bijoux, art, mezouzot, livres et plus.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
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
