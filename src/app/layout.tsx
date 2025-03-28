// src/app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import ClientProviders from "@/components/providers/ClientProviders";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Backline Studios - Reserva de Salas",
  description: "Sistema de reserva de salas para Backline Studios",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <ClientProviders>
          <Toaster />
          <Sonner />
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}