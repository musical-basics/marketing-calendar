import type { Metadata } from "next";
import "./globals.css";
import { StoreProvider } from "@/lib/store";
import { Nav } from "@/components/nav";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "Marketing Calendar",
  description: "Plan and track marketing across all your projects",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-foreground antialiased">
        <StoreProvider>
          <Nav />
          <main className="container mx-auto py-6">{children}</main>
          <Toaster richColors position="top-right" />
        </StoreProvider>
      </body>
    </html>
  );
}
