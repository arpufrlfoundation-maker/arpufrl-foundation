import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import LayoutWrapper from "@/components/common/LayoutWrapper";
import PWAProvider from "@/components/common/PWAProvider";
import { ContentProvider } from "@/lib/content-provider";
import { SessionProvider } from "@/components/auth/SessionProvider";
import { generateMetadata, pageMetadata, generateOrganizationStructuredData } from "@/lib/seo";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = generateMetadata(pageMetadata.home);

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const organizationData = generateOrganizationStructuredData();

  return (
    <html lang="en">
      <head>
        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationData),
          }}
        />

        {/* Preconnect to external domains */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://checkout.razorpay.com" />

        {/* DNS prefetch for performance */}
        <link rel="dns-prefetch" href="https://www.google-analytics.com" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />

        {/* Favicon and app icons */}
        <link rel="icon" href="/ARPUICON.ico" type="image/x-icon" />
        <link rel="shortcut icon" href="/ARPUICON.ico" type="image/x-icon" />
        <link rel="apple-touch-icon" href="/ARPUICON.ico" />

        {/* Theme color for mobile browsers */}
        <meta name="theme-color" content="#059669" />
        <meta name="msapplication-TileColor" content="#059669" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <SessionProvider>
          <PWAProvider>
            <ContentProvider>
              <LayoutWrapper>
                {children}
              </LayoutWrapper>
            </ContentProvider>
          </PWAProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
