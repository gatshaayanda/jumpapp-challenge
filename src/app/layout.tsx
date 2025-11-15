import type { Metadata } from "next";
import { Montserrat, Cormorant_Garamond } from "next/font/google";
import "./globals.css";

import { AnalyticsProvider } from "@/components/AnalyticsProvider";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Loader from "@/components/AdminHubLoader";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import ChatWidget from "@/components/ChatWidget";
import ThemeHydrationScript from "@/components/ThemeHydrationScript";

/* Fonts */
const montserrat = Montserrat({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "600"],
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400", "600"],
  display: "swap",
});

/* Metadata */
export const metadata: Metadata = {
  title: "MeetingPost AI — Jump Challenge by Ayanda",
  description:
    "A lightweight meeting transcript → social media generator app built for the Jump Hiring Challenge.",
};

/* FINAL ERROR-PROOF LAYOUT */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${montserrat.variable} ${cormorant.variable}`}
      suppressHydrationWarning
    >
      <head>
        <ThemeHydrationScript />
      </head>

      <body className="min-h-screen flex flex-col antialiased bg-[--background] text-[--foreground] font-sans">
        <AnalyticsProvider>
          <Loader />

          {/* Header */}
          <div className="sticky top-0 z-50 bg-[--background] backdrop-blur border-b border-[--brand-secondary] shadow-sm">
            <Header />
          </div>

          {/* Page Content */}
          <main className="flex-grow">{children}</main>

          {/* Footer */}
          <Footer /> {/* <-- NO CHILDREN → NO TS ERROR */}

          {/* Extras */}
          <Analytics />
          <ChatWidget />
          <SpeedInsights />
        </AnalyticsProvider>
      </body>
    </html>
  );
}
