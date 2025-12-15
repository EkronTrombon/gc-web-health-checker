import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import MainHeader from "@/components/custom/main-header";
import { ThemeProvider } from "@/components/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GC Web Health Checker",
  description: "Comprehensive website health analysis tool. Validate your website across W3C markup, accessibility, color contrast, Lighthouse performance, SEO, and security headers.",
  keywords: ["web health", "website validator", "accessibility checker", "SEO analyzer", "security headers", "lighthouse", "w3c validator", "contrast checker"],
  authors: [{ name: "GC Web Health Checker" }],
  openGraph: {
    title: "GC Web Health Checker",
    description: "Comprehensive website health analysis tool for markup validation, accessibility, performance, SEO, and security.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`} suppressHydrationWarning>
        <ThemeProvider defaultTheme="dark" storageKey="gc-web-health-checker-theme">
          <MainHeader />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
