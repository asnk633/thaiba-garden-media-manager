import type { Metadata } from "next";
import "./globals.css";
// removed VisualEditsMessenger import (dev-only)
import ErrorReporter from "@/components/ErrorReporter";
import Script from "next/script";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { Toaster } from "@/components/ui/sonner";
import { AppLayout } from "@/components/AppLayout";

export const metadata: Metadata = {
  title: "Thaiba Garden Media Manager",
  description: "Manage your media projects with ease",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider>
          <AuthProvider>
            <ErrorReporter />
            <Script
              src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/scripts//route-messenger.js"
              strategy="afterInteractive"
              data-target-origin="*"
              data-message-type="ROUTE_CHANGE"
              data-include-search-params="true"
              data-only-in-iframe="true"
              data-debug="true"
              data-custom-data='{"appName": "YourApp", "version": "1.0.0", "greeting": "hi"}'
            />
            <AppLayout>{children}</AppLayout>
            <Toaster />
            {/* VisualEditsMessenger removed — it was a dev-only helper not present locally */}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
