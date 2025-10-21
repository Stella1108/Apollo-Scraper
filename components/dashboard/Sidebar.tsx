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
  Sparkles,
  Orbit,
  Home,
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
  onShowLanding?: () => void;
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
  onShowLanding,
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
        {/* Enhanced Header Section */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b border-slate-200 relative bg-gradient-to-r from-slate-50 to-white"
          style={{ minHeight: 75 }}
        >
          <div className="flex items-center gap-3 select-none whitespace-nowrap overflow-hidden">
            {/* Enhanced Icon Container */}
            <div className="relative flex-shrink-0">
              <div className="relative p-2 bg-gradient-to-br from-[#8b39ea] via-[#137fc8] to-[#1d4ed8] rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105">
                <Orbit className="w-6 h-6 text-white" />
                {/* Animated orbiting dot */}
                <div className="absolute -top-1 -right-1">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full animate-ping"></div>
                  <div className="w-2 h-2 bg-yellow-400 rounded-full absolute top-0 right-0"></div>
                </div>
              </div>
              
              {/* Optional: Small sparkle effect */}
              <Sparkles className="absolute -top-1 -right-1 w-3 h-3 text-yellow-400 animate-pulse" />
            </div>

            {/* Enhanced Text */}
            <div className={cn(
              "flex flex-col transition-all duration-300 overflow-hidden",
              collapsed ? "opacity-0 max-w-0" : "opacity-100 max-w-full"
            )}>
              <span className="text-2xl font-bold bg-gradient-to-r from-[#8b39ea] to-[#1d4ed8] bg-clip-text text-transparent leading-tight">
                Globo Polo
              </span>
              <span className="text-xs text-slate-500 font-medium bg-gradient-to-r from-slate-600 to-slate-500 bg-clip-text text-transparent">
                Global Solutions
              </span>
            </div>
          </div>

          {/* Collapse Button */}
          <button
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            onClick={onToggleCollapse}
            className="p-2 rounded-lg hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 absolute top-4 right-0 translate-x-1/2 transition-all duration-200 hover:scale-110"
            type="button"
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4 text-slate-600" />
            ) : (
              <ChevronLeft className="w-4 h-4 text-slate-600" />
            )}
          </button>
        </div>

        <nav
          className="flex-1 overflow-y-auto overflow-visible py-4 relative"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {/* Home Button - Added at the top of navigation */}
          {onShowLanding && (
            <div className="mb-2 px-3">
              <button
                ref={(el) => (buttonRefs.current["home"] = el)}
                onClick={onShowLanding}
                onMouseEnter={() => setHoveredTab("home")}
                onMouseLeave={() => setHoveredTab(null)}
                className={cn(
                  "group relative flex w-full select-none items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-left transition-all duration-200 outline-none",
                  "bg-gradient-to-r from-purple-50 to-pink-50 text-purple-700 hover:from-purple-100 hover:to-pink-100 border border-purple-100 hover:shadow-md"
                )}
              >
                <div className={cn(
                  "p-1.5 rounded-lg transition-all duration-200",
                  "bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-sm group-hover:scale-105"
                )}>
                  <Home className="w-4 h-4 flex-shrink-0" />
                </div>
                
                {!collapsed && (
                  <span className="font-medium transition-all duration-200">
                    Home Page
                  </span>
                )}

                {collapsed && hoveredTab === "home" && buttonRefs.current["home"] && (
                  <TooltipPortal anchorRef={{ current: buttonRefs.current["home"] }}>
                    Home Page
                  </TooltipPortal>
                )}

                {/* Home indicator dot */}
                <div className="absolute right-3 w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
              </button>
            </div>
          )}

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
                    "group relative flex w-full select-none items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-left transition-all duration-200 outline-none",
                    isActive
                      ? "bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-700 shadow-sm border border-blue-100"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 hover:shadow-md"
                  )}
                >
                  <div className={cn(
                    "p-1.5 rounded-lg transition-all duration-200",
                    isActive 
                      ? "bg-gradient-to-br from-blue-500 to-cyan-500 text-white shadow-sm" 
                      : "bg-slate-100 text-slate-600 group-hover:bg-slate-200 group-hover:scale-105"
                  )}>
                    <Icon className="w-4 h-4 flex-shrink-0" />
                  </div>
                  
                  {!collapsed && (
                    <span className="font-medium transition-all duration-200">
                      {tab.label}
                    </span>
                  )}

                  {collapsed && isHovered && buttonRefs.current[tab.id] && (
                    <TooltipPortal anchorRef={{ current: buttonRefs.current[tab.id] }}>
                      {tab.label}
                    </TooltipPortal>
                  )}

                  {/* Active indicator dot */}
                  {isActive && (
                    <div className="absolute right-3 w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Optional: Footer section */}
          {!collapsed && (
            <div className="px-3 pt-4 mt-4 border-t border-slate-200">
              <div className="text-xs text-slate-500 text-center">
                <div className="font-semibold text-slate-700 mb-1">Globo Polo Suite</div>
                <div className="text-slate-400">v2.1.0 • Professional</div>
              </div>
            </div>
          )}
        </nav>
      </div>
    </div>
  );
}