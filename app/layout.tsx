import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Apex Partner Portal",
  description: "Apply to become an Apex Fleet Consulting referral partner and manage referrals, agreements, and compensation.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
