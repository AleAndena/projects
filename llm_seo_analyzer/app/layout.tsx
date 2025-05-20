// app/layout.tsx
import type { Metadata } from "next";
import { Roboto_Mono } from "next/font/google";
import "./globals.css";

// load Roboto Mono (feel free to tweak weights or subsets)
const robotoMono = Roboto_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "LLM SEO analyzer",
  description: "Scans a site and determines how visible it is to LLMs",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      {/* apply the Roboto Mono class to body */}
      <body className={`${robotoMono.className} antialiased`}>
        {children}
      </body>
    </html>
  );
}
