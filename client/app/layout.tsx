// 'use client';
import { ThemeProvider } from "@/app/utils/theme-provide";
import type { Metadata } from "next";
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


export const metadata: Metadata = {
  title: "Elearing",
  description:
    "Elearing is a platform for students to learn and get help from teachers",
  keywords: ["Programming", "MERN", "Redux", "Machine Learning"],
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
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem={false}
          >
            {children}
            <Toaster position="top-right" reverseOrder={false} />
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  );
}
