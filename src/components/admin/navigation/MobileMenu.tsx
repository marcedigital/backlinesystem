"use client";

import Image from "next/image";
import React from "react";
import { LogOut, Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { SidebarMenu } from "@/components/ui/sidebar";
import NavigationItems from "./NavigationItems";

interface MobileMenuProps {
  isMenuOpen: boolean;
  setIsMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
  expandedSections: Record<string, boolean>;
  toggleSection: (section: string) => void;
  isActive: (path: string) => boolean;
  handleLogout: () => void;
}

const MobileMenu: React.FC<MobileMenuProps> = ({
  isMenuOpen,
  setIsMenuOpen,
  expandedSections,
  toggleSection,
  isActive,
  handleLogout,
}) => {
  return (
    <div className="md:hidden fixed top-4 left-4 z-50">
      <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="h-10 w-10">
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-0">
          <div className="flex flex-col h-full bg-sidebar text-sidebar-foreground">
            <div className="border-b flex items-center gap-2 px-4 h-14">
              <Image
                src="/logo.png"
                alt="Backline Studios Logo"
                width={32}
                height={32}
                className="h-8 w-auto"
                priority
              />
              <span className="font-semibold text-xl">Backline Studios</span>
            </div>
            <div className="flex-1 p-2">
              <SidebarMenu>
                <NavigationItems
                  expandedSections={expandedSections}
                  toggleSection={toggleSection}
                  isActive={isActive}
                  onItemClick={() => setIsMenuOpen(false)}
                />
              </SidebarMenu>
            </div>
            <div className="border-t p-4">
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Cerrar Sesión
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default MobileMenu;
