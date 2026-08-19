import "./globals.css";
import type { Metadata, Viewport } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://rcvagency.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "RCV Agency — Websites that make local businesses impossible to overlook.",
  description: "RCV Agency creates high-converting websites for ambitious local service businesses.",
  applicationName: "RCV Agency",
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "RCV Agency",
    title: "RCV Agency — Websites that make local businesses impossible to overlook.",
    description: "RCV Agency creates high-converting websites for ambitious local service businesses.",
  },
  twitter: {
    card: "summary_large_image",
    title: "RCV Agency",
    description: "Premium websites for ambitious local service businesses.",
  },
};

// Next 15 wants themeColor on the viewport export, not metadata.
export const viewport: Viewport = { themeColor: "#4F46E5" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en">
    <head>
      <link rel="preconnect" href="https://unicons.iconscout.com" />
      <link rel="stylesheet" href="https://unicons.iconscout.com/release/v4.0.8/css/line.css" />
    </head>
    <body>{children}</body>
  </html>;
}
