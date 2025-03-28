"use client";

import { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BookingProvider } from "@/context/BookingContext";
import { AdminAuthProvider } from "@/context/AdminAuthContext";

// Create a client-side QueryClient
const queryClient = new QueryClient();

export default function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <BookingProvider>
        <AdminAuthProvider>
          <TooltipProvider>{children}</TooltipProvider>
        </AdminAuthProvider>
      </BookingProvider>
    </QueryClientProvider>
  );
}