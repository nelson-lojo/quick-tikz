import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Quick TikZ",
  description: "Quickly create and compose TikZ figure",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* <script src="https://bill-ion.github.io/tikzjax-live/dist/tikzjax.js" /> */}
        {/* <script src="https://tikzjax-demo.glitch.me/tikzjax.js" /> */}
        {/* <link rel="stylesheet" type="text/css" href="http://tikzjax.com/v1/fonts.css" /> */}
      </head>
      <body className={`${inter.variable} antialiased`}>
        <AuthProvider>
          {/* <Navigation /> */}
          <main>{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
