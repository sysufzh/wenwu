import type { Metadata } from "next";
import "./globals.css";
import AppShell from "@/components/AppShell";

export const metadata: Metadata = {
  title: "文物库房台账系统",
  description: "中国社会科学院考古研究所东南队文物库房台账",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" className="h-full">
      <body className="min-h-full flex flex-col lg:flex-row bg-stone-100">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
