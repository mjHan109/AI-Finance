import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SessionProvider } from "@/components/session-provider";
import { ServiceWorkerRegister } from "@/components/service-worker-register";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Podo 🍇",
  description: "포도처럼 알차게, AI 개인 재정 관리",
  viewport: {
    width: "device-width",
    initialScale: 1,
    viewportFit: "cover", // Required for iPhone notch / home indicator safe area
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Podo",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col">
          <SessionProvider>{children}</SessionProvider>
          <ServiceWorkerRegister />
        </body>
    </html>
  );
}
