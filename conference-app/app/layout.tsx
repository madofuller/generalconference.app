import type { Metadata } from "next";
import "./globals.css";
import { FilterProvider } from "@/lib/filter-context";

export const metadata: Metadata = {
  title: "Scripture General Conference Analysis",
  description: "Comprehensive analysis tool for LDS General Conference talks",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <FilterProvider>
          {children}
        </FilterProvider>
      </body>
    </html>
  );
}
