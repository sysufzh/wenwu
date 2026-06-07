import type { Metadata } from "next";
import "./globals.css";
import AppShell from "@/components/AppShell";

export const metadata: Metadata = {
  title: "中国社会科学院考古研究所东南工作队队务管理系统",
  description: "文物库房台账、工具管理、记账系统",
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
