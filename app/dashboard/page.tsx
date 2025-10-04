"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Header } from "@/components/dashboard/Header";
import { ApolloScraperTab } from "@/components/dashboard/tabs/ApolloScraperTab";
import { EmailVerifierTab } from "@/components/dashboard/tabs/EmailVerifierTab";
import { CustomListTab } from "@/components/dashboard/tabs/CustomListTab";
import { ComingSoonTab } from "@/components/dashboard/tabs/ComingSoonTab";
import { BillingTab } from "@/components/dashboard/tabs/BillingTab";
import { Loader as Loader2 } from "lucide-react";

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState("apollo-scraper");
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const renderTabContent = () => {
    switch (activeTab) {
      case "apollo-scraper":
        return <ApolloScraperTab />;
      case "email-verifier":
        return <EmailVerifierTab />;
      case "custom-list":
        return <CustomListTab />;
      case "billing":
        return <BillingTab />;
      case "email-warmup":
        return (
          <ComingSoonTab
            title="Email Warm-up"
            description="Gradually increase email sending volume to improve deliverability"
          />
        );
      case "web-scraping":
        return (
          <ComingSoonTab
            title="Web Scraping"
            description="Extract data from any website with our powerful scraping engine"
          />
        );
      case "sales-navigator":
        return (
          <ComingSoonTab
            title="Sales Navigator"
            description="Integrate with LinkedIn Sales Navigator for enhanced prospecting"
          />
        );
      case "lead-management":
        return (
          <ComingSoonTab
            title="Lead Management"
            description="Organize and manage your leads with our CRM-like interface"
          />
        );
      case "account":
        return (
          <ComingSoonTab
            title="Account Settings"
            description="Manage your profile, preferences, and security settings"
          />
        );
      case "affiliate":
        return (
          <ComingSoonTab
            title="Affiliate Program"
            description="Earn rewards by referring Apollo Scraper to others"
          />
        );
      case "support":
        return (
          <ComingSoonTab
            title="Support Center"
            description="Get help with Apollo Scraper features and troubleshooting"
          />
        );
      default:
        return <ApolloScraperTab />;
    }
  };

  // Sidebar widths in pixels to use for margin calculation
  const sidebarExpandedWidth = 10; // 18.75rem * 16px
  const sidebarCollapsedWidth = 10; // 5.625rem * 16px approximately

  const marginLeft = collapsed ? sidebarCollapsedWidth : sidebarExpandedWidth;

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <aside>
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed(!collapsed)}
        />
      </aside>

      <main
        className="flex-1 flex flex-col min-w-0 transition-margin duration-300"
        style={{ marginLeft }}
      >
        <Header collapsed={collapsed} />
        <div className="flex-1 overflow-y-auto">
          <div className="p-2">{renderTabContent()}</div>
        </div>
      </main>
    </div>
  );
}
