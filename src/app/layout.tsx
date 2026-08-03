import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import { CartProvider } from "@/components/cart/cart-context";
import { SiteHeader } from "@/components/layout/site-header";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600", "700"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://patimah-sthore.shop"),
  title: {
    default: "SAUMA SHOP — Belanja Produk Digital & Fisik",
    template: "%s | SAUMA SHOP",
  },
  description:
    "SAUMA SHOP — marketplace produk digital (e-book, template, source code) dan produk fisik (makanan, telur) dengan sistem voucher, coin, dan referral.",
  openGraph: {
    type: "website",
    locale: "id_ID",
    siteName: "SAUMA SHOP",
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={`${fraunces.variable} ${inter.variable}`}>
      <body>
        <CartProvider>
          <SiteHeader />
          {children}
        </CartProvider>
      </body>
    </html>
  );
}
