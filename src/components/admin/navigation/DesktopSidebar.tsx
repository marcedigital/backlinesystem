"use client";
import Image from "next/image";
import React from "react";
import { LogOut } from "lucide-react";
import {
  Sidebar,
  SidebarRail,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import NavigationItems from "./NavigationItems";

interface DesktopSidebarProps {
  expandedSections: Record<string, boolean>;
  toggleSection: (section: string) => void;
  isActive: (path: string) => boolean;
  handleLogout: () => void;
}

const DesktopSidebar: React.FC<DesktopSidebarProps> = ({
  expandedSections,
  toggleSection,
  isActive,
  handleLogout,
}) => {
  return (
    <Sidebar className="hidden md:flex">
      <SidebarRail />
      <SidebarHeader className="border-b">
        <div className="flex items-center gap-2 px-4 h-14">
          <Image
            src="/logo.png"
            alt="Backline Studios Logo"
            width={110} // Assuming h-8 means height: 2rem (32px)
            height={40} // Maintaining aspect ratio
            className="h-12"
          />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          <NavigationItems
            expandedSections={expandedSections}
            toggleSection={toggleSection}
            isActive={isActive}
          />
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="border-t p-4">
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Cerrar Sesión
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
};

export default DesktopSidebar;
