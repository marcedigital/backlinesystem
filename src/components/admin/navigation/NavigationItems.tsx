"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Settings, BookOpen } from 'lucide-react';
import { 
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton
} from '@/components/ui/sidebar';

interface NavigationItemsProps {
  expandedSections: Record<string, boolean>;
  toggleSection: (section: string) => void;
  isActive: (path: string) => boolean;
  onItemClick?: () => void;
}

const NavigationItems: React.FC<NavigationItemsProps> = ({
  expandedSections,
  toggleSection,
  isActive,
  onItemClick
}) => {
  const pathname = usePathname();
  
  return (
    <>
      <SidebarMenuItem>
        <SidebarMenuButton 
          asChild 
          isActive={isActive('/admin/dashboard')}
          onClick={onItemClick}
        >
          <Link href="/admin/dashboard">
            <LayoutDashboard />
            <span>Panel Principal</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
      
      <SidebarMenuItem>
        <SidebarMenuButton 
          onClick={() => toggleSection('reservaciones')}
        >
          <BookOpen />
          <span>Reservaciones</span>
        </SidebarMenuButton>
        {expandedSections.reservaciones && (
          <SidebarMenuSub>
            <SidebarMenuSubItem>
              <SidebarMenuSubButton 
                asChild 
                isActive={isActive('/admin/reservaciones')}
                onClick={onItemClick}
              >
                <Link href="/admin/reservaciones">Reservas</Link>
              </SidebarMenuSubButton>
            </SidebarMenuSubItem>
            <SidebarMenuSubItem>
              <SidebarMenuSubButton 
                asChild 
                isActive={pathname.includes('/admin/clientes')}
                onClick={onItemClick}
              >
                <Link href="/admin/reservaciones?tab=clientes">Clientes</Link>
              </SidebarMenuSubButton>
            </SidebarMenuSubItem>
          </SidebarMenuSub>
        )}
      </SidebarMenuItem>
      
      <SidebarMenuItem>
        <SidebarMenuButton 
          onClick={() => toggleSection('configuracion')}
        >
          <Settings />
          <span>Configuración</span>
        </SidebarMenuButton>
        {expandedSections.configuracion && (
          <SidebarMenuSub>
            <SidebarMenuSubItem>
              <SidebarMenuSubButton 
                asChild 
                isActive={isActive('/admin/settings') && !pathname.includes('?tab=')}
                onClick={onItemClick}
              >
                <Link href="/admin/settings">Salas</Link>
              </SidebarMenuSubButton>
            </SidebarMenuSubItem>
            <SidebarMenuSubItem>
              <SidebarMenuSubButton 
                asChild 
                isActive={pathname.includes('/admin/settings?tab=emails')}
                onClick={onItemClick}
              >
                <Link href="/admin/settings?tab=emails">Notificaciones</Link>
              </SidebarMenuSubButton>
            </SidebarMenuSubItem>
            <SidebarMenuSubItem>
              <SidebarMenuSubButton 
                asChild 
                isActive={pathname.includes('/admin/settings?tab=coupons')}
                onClick={onItemClick}
              >
                <Link href="/admin/settings?tab=coupons">Cupones</Link>
              </SidebarMenuSubButton>
            </SidebarMenuSubItem>
          </SidebarMenuSub>
        )}
      </SidebarMenuItem>
    </>
  );
};

export default NavigationItems;