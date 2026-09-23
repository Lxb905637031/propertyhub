import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PropertyHub",
  description: "物业集团采购与积分福利商城",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
