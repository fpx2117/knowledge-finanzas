import type { Metadata } from "next";

import "./globals.css";
import { satoshi } from "@/lib/fonts";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";

export const metadata: Metadata = {
  title: "Know Finanzas",
  description: "Tu sistema personal de control financiero.",
  icons: {
    icon: [{ url: "/brand/logo.png", type: "image/png" }],
    apple: [{ url: "/brand/logo.png" }],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={cn("font-sans", satoshi.variable)} suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <TooltipProvider>{children}</TooltipProvider>
          <Toaster duration={6000} />
        </ThemeProvider>
      </body>
    </html>
  );
}
