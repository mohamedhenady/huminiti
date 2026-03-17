import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-cairo",
});

export const metadata: Metadata = {
  title: "هيومنيتي — نظام إدارة دفعات الأدوية",
  description: "نظام إدارة دفعات الأدوية — تعاون بين صيدلية السعوي ومؤسسة هيومنيتي",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" className={cairo.variable}>
      <body className="font-cairo bg-background text-text-primary antialiased">
        {children}
      </body>
    </html>
  );
}
