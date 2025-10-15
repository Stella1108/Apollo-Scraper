"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import {
  Rocket,
  Mail,
  ListChecks,
  Flame,
  Globe,
  Users,
  FolderKanban,
  User as UserIcon,
  Gift,
  CreditCard,
  CircleHelp as HelpCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export interface SidebarTab {
  id: string;
  label: string;
  icon: any;
}

const tabs: SidebarTab[] = [
  { id: "apollo-scraper", label: "Apollo Scraper", icon: Rocket },
  { id: "email-verifier", label: "Email Verifier", icon: Mail },
  { id: "custom-list", label: "Custom List", icon: ListChecks },
  { id: "email-warmup", label: "Email Warm-up", icon: Flame },
  { id: "web-scraping", label: "Web Scraping", icon: Globe },
  { id: "sales-navigator", label: "Sales Navigator", icon: Users },
  { id: "lead-management", label: "Lead Management", icon: FolderKanban },
  { id: "account", label: "Account", icon: UserIcon },
  { id: "affiliate", label: "Affiliate", icon: Gift },
  { id: "billing", label: "Billing", icon: CreditCard },
  { id: "support", label: "Support", icon: HelpCircle },
];

interface SidebarProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

function TooltipPortal({
  anchorRef,
  children,
}: {
  anchorRef: React.RefObject<HTMLButtonElement>;
  children: React.ReactNode;
}) {
  const [coords, setCoords] = React.useState<{ top: number; left: number } | null>(null);

  React.useEffect(() => {
    function updatePosition() {
      if (anchorRef.current) {
        const rect = anchorRef.current.getBoundingClientRect();
        setCoords({
          top: rect.top + rect.height / 2,
          left: rect.right + 8,
        });
      }
    }
    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition);
    };
  }, [anchorRef]);

  if (!coords) return null;

  return createPortal(
    <div
      style={{
        position: "fixed",
        top: coords.top,
        left: coords.left,
        transform: "translateY(-50%)",
        pointerEvents: "none",
        zIndex: 9999,
      }}
      className="whitespace-nowrap rounded-md bg-slate-900 px-3 py-1.5 text-sm font-semibold text-white shadow-lg select-none"
    >
      {children}
    </div>,
    document.body
  );
}

export function Sidebar({
  activeTab,
  onTabChange,
  collapsed,
  onToggleCollapse,
}: SidebarProps) {
  const [hoveredTab, setHoveredTab] = React.useState<string | null>(null);
  const buttonRefs = React.useRef<{ [key: string]: HTMLButtonElement | null }>({});

  return (
    <div className="relative flex">
      <div
        className={cn(
          "h-full bg-white border-r border-slate-200 flex flex-col relative overflow-visible transition-[width] duration-300 ease-in-out",
          collapsed ? "w-25 min-w-[50px]" : "w-[15.75rem] min-w-[200px]"
        )}
      >
        <div
          className="flex items-center justify-between px-6 py-4 border-b border-slate-200 relative"
          style={{ minHeight: 75 }}
        >
          <div className="flex items-center gap-2 select-none whitespace-nowrap overflow-hidden">
            <div className="p-2 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-lg shadow-md flex-shrink-0 transition-transform duration-300">
              <Rocket
                className={cn("w-6 h-6 text-white", collapsed ? "scale-90" : "scale-100")}
              />
            </div>
            <span
              className={cn(
                "text-xl font-bold bg-gradient-to-r from-blue-500 via-purple-600 to-indigo-700 bg-clip-text text-transparent transition-opacity duration-300",
                collapsed ? "opacity-0 max-w-0 overflow-hidden" : "opacity-100 max-w-full"
              )}
              style={{
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                transitionProperty: "opacity, max-width",
              }}
            >
              Apollo Scraper
            </span>
          </div>
          <button
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            onClick={onToggleCollapse}
            className="p-1 rounded-md hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 absolute top-4 right-0 translate-x-1/2"
            type="button"
          >
            {collapsed ? (
              <ChevronRight className="w-5 h-5 text-slate-600 transition-transform duration-300" />
            ) : (
              <ChevronLeft className="w-5 h-5 text-slate-600 transition-transform duration-300" />
            )}
          </button>
        </div>

        <nav
          className="flex-1 overflow-y-auto overflow-visible py-4 relative"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          <div className="space-y-1 px-3">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              const isHovered = hoveredTab === tab.id;

              return (
                <button
                  key={tab.id}
                  ref={(el) => (buttonRefs.current[tab.id] = el)}
                  onClick={() => onTabChange(tab.id)}
                  onMouseEnter={() => setHoveredTab(tab.id)}
                  onMouseLeave={() => setHoveredTab(null)}
                  
                  className={cn(
                    "group relative flex w-full select-none items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-left transition-colors duration-200 outline-none",
                    isActive
                      ? "bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-700 shadow-sm"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  )}
                >
                  <Icon
                    className={cn(
                      "flex-shrink-0 transition-transform duration-300",
                      isActive ? "text-blue-600" : "text-slate-400",
                      collapsed ? "mx-auto" : ""
                    )}
                  />
                  {!collapsed && <span>{tab.label}</span>}

                  {collapsed && isHovered && buttonRefs.current[tab.id] && (
                    <TooltipPortal anchorRef={{ current: buttonRefs.current[tab.id] }}>
                      {tab.label}
                    </TooltipPortal>
                  )}
                </button>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
