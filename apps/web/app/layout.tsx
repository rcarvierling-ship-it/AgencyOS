import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "RCV Agency — Websites that make local businesses impossible to overlook.",
  description: "RCV Agency creates high-converting websites for ambitious local service businesses.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
