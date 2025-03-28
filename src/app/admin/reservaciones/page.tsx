"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import AdminLayout from '@/components/admin/AdminLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ReservasList from '@/components/admin/reservaciones/ReservasList';
import ClientesList from '@/components/admin/reservaciones/ClientesList';

// Create a component that safely uses search params
function ReservacionesContent() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabParam === 'clientes' ? 'clientes' : 'reservas');

  useEffect(() => {
    // Update active tab when URL parameters change
    if (tabParam === 'clientes') {
      setActiveTab('clientes');
    } else {
      setActiveTab('reservas');
    }
  }, [tabParam]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    // Note: In Next.js, you'd typically use router.push() with a search param
    // Instead of modifying searchParams directly
    // This would be done in a wrapper component that handles URL changes
  };

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
      <TabsList className="mb-4">
        <TabsTrigger value="reservas">Reservas</TabsTrigger>
        <TabsTrigger value="clientes">Clientes</TabsTrigger>
      </TabsList>
      <TabsContent value="reservas">
        <ReservasList />
      </TabsContent>
      <TabsContent value="clientes">
        <ClientesList />
      </TabsContent>
    </Tabs>
  );
}

export default function Reservaciones() {
  return (
    <AdminLayout title="Reservaciones">
      <Suspense fallback={<div>Loading...</div>}>
        <ReservacionesContent />
      </Suspense>
    </AdminLayout>
  );
}