import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "הבית החדש",
  description: "מערכת חכמה לניהול הבית והמשפחה",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl">
      <body className="antialiased bg-gray-50 text-gray-900">
        {children}
      </body>
    </html>
  );
}