// 'use client';
import type { Metadata, Viewport } from "next";
import { Josefin_Sans, Poppins } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "./globals.css";
import { Providers } from "./Provider";

const poppinsSans = Poppins({
  variable: "--font-poppins-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const josefinSans = Josefin_Sans({
  variable: "--font-josefin-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

// Absolute site URL, used by the Metadata API to resolve relative assets
// (Open Graph / Twitter images, og:url, etc.) into fully-qualified URLs that
// external crawlers (WhatsApp, LinkedIn, Facebook, Telegram, Discord, Slack,
// X) can fetch. Falls back to localhost for local development; set
// NEXT_PUBLIC_SITE_URL in deployment envs (see client/readme.md#environment-variables).
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const siteName = "Elearing";
const siteTitle = "Elearing";
const siteDescription =
  "Elearing is a platform for students to learn and get help from teachers";
// Reuses the existing landing-page hero asset as the social share preview
// image rather than introducing a new one.
const previewImage = "/assets/hero-banner-1.png";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: siteTitle,
    template: `%s | ${siteName}`,
  },
  description: siteDescription,
  keywords: ["Programming", "MERN", "Redux", "Machine Learning"],
  openGraph: {
    title: siteTitle,
    description: siteDescription,
    url: "/",
    siteName,
    images: [
      {
        url: previewImage,
        width: 1200,
        height: 630,
        alt: siteTitle,
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
    images: [previewImage],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      // className={`${poppinsSans.variable} ${josefinSans.variable} `}
      suppressHydrationWarning
      // h-full antialiased
    >
      <body
        className={`${poppinsSans.variable} ${josefinSans.variable} bg-white! dark:bg-linear-to-b dark:from-gray-900 dark:to-black duration-300 bg-no-repeat`}
      >
        <Providers>
            {children}
            <Toaster position="top-right" reverseOrder={false} />
        </Providers>
      </body>
    </html>
  );
}