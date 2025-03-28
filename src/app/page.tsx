"use client";
import Calendar from '@/components/Calendar';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Main content */}
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex flex-col items-center mb-8">
          <img 
            src="/logo.png" 
            alt="Backline Studios Logo" 
            className="h-24 mb-4" 
          />
          <h1 className="text-3xl md:text-4xl font-bold text-center">Backline Studios - Reserva de Salas</h1>
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