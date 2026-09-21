// this file is the shell every page sits inside — the only place <html> and <body> exist
// loads tailwind (globals.css), the fonts, and the browser tab title

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SideNav } from "@/components/SideNav";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// next writes this into the page's <head>
export const metadata: Metadata = {
  title: "FitDrip",
  description: "digital wardrobe and ai stylist",
};

// next.js calls this function on any page visit (main page, /wardrobe page, etc)
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex">
        <SideNav />
        <div className="flex-1 pl-16">{children}</div>
      </body>

    </html>
  );
}
