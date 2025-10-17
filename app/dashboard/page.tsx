"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Header } from "@/components/dashboard/Header";
import { ApolloScraperTab } from "@/components/dashboard/tabs/ApolloScraperTab";
import { EmailVerifierTab } from "@/components/dashboard/tabs/EmailVerifierTab";
import { CustomListTab } from "@/components/dashboard/tabs/CustomListTab";
import { BillingTab } from "@/components/dashboard/tabs/BillingTab";
import { WebScrapingTab } from "@/components/dashboard/tabs/WebScrapingTab";
import { ComingSoonTab } from "@/components/dashboard/tabs/ComingSoonTab";
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

  const handleToggleCollapse = () => {
    setCollapsed(!collapsed);
  };

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
        return <ApolloScraperTab user={user} />;
      case "email-verifier":
        return <EmailVerifierTab user={user} />;
      case "custom-list":
        return <CustomListTab user={user} />;
      case "web-scraping":
        return <WebScrapingTab user={user} />;
      case "billing":
        return <BillingTab user={user} />;
      case "email-warmup":
        return (
          <ComingSoonTab
            title="Email Warm-up"
            description="Gradually increase email sending volume to improve deliverability"
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
        return <ApolloScraperTab user={user} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 grid transition-all duration-350 ease-in-out"
      style={{ 
        gridTemplateColumns: collapsed ? '6rem 1fr' : '16rem 1fr'
      }}
    >
      {/* Sidebar */}
      <div className="h-full">
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          collapsed={collapsed}
          onToggleCollapse={handleToggleCollapse}
        />
      </div>

      {/* Main content */}
      <div className="flex flex-col min-w-0 overflow-hidden">
        <Header collapsed={collapsed} />
        <div className="flex-1 overflow-y-auto">
          <div className="p-2">{renderTabContent()}</div>
        </div>
      </div>
    </div>
  );
}