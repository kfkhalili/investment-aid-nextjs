// app/layout.tsx
import type { Metadata } from "next";
import { ThemeProvider } from "@/components/theme-provider";
import { ClerkProvider } from "@clerk/nextjs";
import { Geist, Geist_Mono } from "next/font/google";
import "@/globals.css";
import Navbar from "@/components/navbar"; // ← absolute path
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/toaster"; // Import Toaster

const geistSans = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });
const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "Investment Aid",
  description:
    "Track, analyze, and uncover global investment opportunities — all in one intuitive platform.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`} // ← add bg
        >
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <SidebarProvider>
              <SidebarInset>
                <Navbar />
                <main className="flex-1">{children}</main>
                <Toaster />
              </SidebarInset>
            </SidebarProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
