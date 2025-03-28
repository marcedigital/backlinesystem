"use client";
import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import AdminLayout from '@/components/admin/AdminLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import RoomsSettings from '@/components/admin/settings/RoomsSettings';
import EmailSettings from '@/components/admin/settings/EmailSettings';
import CouponsSettings from '@/components/admin/settings/CouponsSettings';

// The component that uses searchParams
function AdminSettingsContent() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(
    tabParam === 'emails' ? 'emails' : 
    tabParam === 'coupons' ? 'coupons' : 'rooms'
  );

  useEffect(() => {
    // Update active tab when URL parameters change
    if (tabParam === 'emails') {
      setActiveTab('emails');
    } else if (tabParam === 'coupons') {
      setActiveTab('coupons');
    } else {
      setActiveTab('rooms');
    }
  }, [tabParam]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    // Note: In Next.js, you'd typically use router.push() with a search param
    // This would be done in a wrapper component that handles URL changes
  };

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
      <TabsList className="grid w-full md:w-auto grid-cols-3 mb-4">
        <TabsTrigger value="rooms">Salas</TabsTrigger>
        <TabsTrigger value="emails">Notificaciones</TabsTrigger>
        <TabsTrigger value="coupons">Cupones</TabsTrigger>
      </TabsList>
      
      <Card>
        <TabsContent value="rooms" className="p-4">
          <RoomsSettings />
        </TabsContent>
        
        <TabsContent value="emails" className="p-4">
          <EmailSettings />
        </TabsContent>
        
        <TabsContent value="coupons" className="p-4">
          <CouponsSettings />
        </TabsContent>
      </Card>
    </Tabs>
  );
}

// Main component with Suspense boundary
export default function AdminSettings() {
  return (
    <AdminLayout title="Configuración">
      <Suspense fallback={
        <div className="flex items-center justify-center p-12">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
        </div>
      }>
        <AdminSettingsContent />
      </Suspense>
    </AdminLayout>
  );
}