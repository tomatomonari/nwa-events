import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NWA.events — Discover What's Happening in Northwest Arkansas",
  description:
    "High-signal in-person events in NWA — curated from LinkedIn, Luma, Meetup, and more so you don't have to check them all.",
  icons: {
    icon: [
      { url: "/nwa.events.logo.png", media: "(prefers-color-scheme: light)" },
      { url: "/nwa.events.logo-dark.png", media: "(prefers-color-scheme: dark)" },
    ],
    apple: "/nwa.events.logo.png",
  },
  openGraph: {
    title: "NWA.events — Discover What's Happening in Northwest Arkansas",
    description:
      "High-signal in-person events in NWA — curated from LinkedIn, Luma, Meetup, and more so you don't have to check them all.",
    url: "https://nwa.events",
    siteName: "NWA.events",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased min-h-dvh flex flex-col`}>
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
