import type { Metadata } from "next";
import "./globals.css";
import NavSidebar from "@/components/NavSidebar";

export const metadata: Metadata = {
  title: "文物库房台账系统",
  description: "中国社会科学院考古研究所东南队文物库房台账",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" className="h-full">
      <body className="min-h-full flex flex-col lg:flex-row bg-stone-100">
        <NavSidebar />
        <main className="flex-1 p-4 pb-20 lg:pb-4 lg:ml-56 overflow-auto">
          {children}
        </main>
      </body>
    </html>
  );
}
