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
    "One place to discover networking events, tech meetups, startup events, and more in Fayetteville, Bentonville, Rogers, and all of NWA.",
  openGraph: {
    title: "NWA.events — Discover What's Happening in Northwest Arkansas",
    description:
      "Networking, tech, startups, career — everything happening in NWA, in one feed.",
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
      <body className={`${inter.variable} antialiased`}>
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
