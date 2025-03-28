"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { useToast } from '@/hooks/use-toast';
import { SidebarProvider } from '@/components/ui/sidebar';
import MobileMenu from './navigation/MobileMenu';
import DesktopSidebar from './navigation/DesktopSidebar';

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children, title }) => {
  const { isAuthenticated, logout } = useAdminAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    reservaciones: pathname.includes('/admin/reservaciones'),
    configuracion: pathname.includes('/admin/settings')
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    // If not authenticated, redirect to login
    if (!isAuthenticated) {
      router.push('/admin');
    }
  }, [isAuthenticated, router]);

  const handleLogout = () => {
    logout();
    toast({
      title: "Sesión cerrada",
      description: "Ha cerrado sesión exitosamente.",
    });
    router.push('/admin');
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const isActive = (path: string) => {
    return pathname === path;
  };

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex bg-slate-50 w-full">
        {/* Mobile Menu */}
        <MobileMenu
          isMenuOpen={isMobileMenuOpen}
          setIsMenuOpen={setIsMobileMenuOpen}
          expandedSections={expandedSections}
          toggleSection={toggleSection}
          isActive={isActive}
          handleLogout={handleLogout}
        />

        {/* Desktop Sidebar */}
        <DesktopSidebar
          expandedSections={expandedSections}
          toggleSection={toggleSection}
          isActive={isActive}
          handleLogout={handleLogout}
        />
        
        <main className="flex-1 overflow-auto md:ml-0">
          <div className="container mx-auto py-6 px-6">
            <h1 className="text-3xl font-bold mb-6 mt-10 md:mt-0">{title}</h1>
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default AdminLayout;