"use client";
import Calendar from "@/components/Calendar";
import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Main content */}
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex flex-col items-center mb-8">
          <Image
            src="/logo.png"
            alt="Backline Studios Logo"
            width={96} // Specify width (equivalent to h-24 which is roughly 96px)
            height={96} // Maintain aspect ratio
            className="mb-4"
            priority // Optional: for above-the-fold important images
          />
          <h1 className="text-3xl md:text-4xl font-bold text-center">
            Backline Studios - Reserva de Salas
          </h1>
        </div>
        <Calendar />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-border py-4 mt-auto">
        <div className="container mx-auto px-4 text-center text-sm text-gray-600">
          Backline Studios &copy; {new Date().getFullYear()}
        </div>
      </footer>
    </div>
  );
}
