"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Orbit, Database, Mail, Users, Rocket, TrendingUp, Zap, ArrowRight, Sparkles, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { Header } from '@/components/dashboard/Header';
import { ApolloScraperTab } from '@/components/dashboard/tabs/ApolloScraperTab';
import { EmailVerifierTab } from '@/components/dashboard/tabs/EmailVerifierTab';
import { CustomListTab } from '@/components/dashboard/tabs/CustomListTab';
import { BillingTab } from '@/components/dashboard/tabs/BillingTab';
import WebScrapingTab from '@/components/dashboard/tabs/WebScrapingTab';
import { ComingSoonTab } from '@/components/dashboard/tabs/ComingSoonTab';

export default function HomePage() {
  const { user, loading, signOut } = useAuth(); // Add signOut from useAuth
  const router = useRouter();
  const [showLanding, setShowLanding] = useState(true);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!loading) {
      // Show landing page by default for all users
      setShowLanding(true);
      setTimeout(() => setIsVisible(true), 100);
    }
  }, [loading]);

  const handleGoToDashboard = () => {
    if (user) {
      setShowLanding(false);
    } else {
      router.push('/login');
    }
  };

  const handleShowLanding = () => {
    setShowLanding(true);
  };

  // Add handleSignOut function
  const handleSignOut = async () => {
    try {
      await signOut();
      // After sign out, redirect to login page
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
      // Even if there's an error, redirect to login page
      router.push('/login');
    }
  };

  // Show dashboard when user is logged in and not showing landing page
  if (!showLanding && user) {
    return <DashboardContent user={user} onShowLanding={handleShowLanding} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
        <div className="relative">
          <Loader2 className="w-14 h-14 animate-spin text-[#8b39ea]" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#8b39ea] to-[#137fc8] rounded-full blur-lg opacity-30 animate-pulse"></div>
        </div>
      </div>
    );
  }

  // Landing Page Content
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-1000"></div>
        <div className="absolute bottom-1/4 left-1/2 w-72 h-72 bg-cyan-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-2000"></div>
      </div>

      {/* Header */}
      <header className={`bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50 transition-all duration-700 ${isVisible ? 'translate-y-0 opacity-100' : '-translate-y-10 opacity-0'}`}>
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 select-none whitespace-nowrap overflow-hidden">
              <div className="relative flex-shrink-0">
                <div className="relative p-2 bg-gradient-to-br from-[#8b39ea] via-[#137fc8] to-[#1d4ed8] rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 group">
                  <Orbit className="w-6 h-6 text-white transform group-hover:rotate-180 transition-transform duration-500" />
                  <div className="absolute -top-1 -right-1">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full animate-ping"></div>
                    <div className="w-2 h-2 bg-yellow-400 rounded-full absolute top-0 right-0 group-hover:scale-150 transition-transform duration-300"></div>
                  </div>
                  <Sparkles className="absolute -bottom-1 -left-1 w-3 h-3 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-pulse" />
                </div>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-[#8b39ea] to-[#1d4ed8] bg-clip-text text-transparent">
                Globo Polo
              </span>
            </div>
            
            <div className="flex items-center space-x-3">
              {user ? (
                <>
                  <Button 
                    variant="ghost" 
                    onClick={handleGoToDashboard}
                    className="text-gray-600 hover:text-[#8b39ea] text-sm transform hover:scale-105 transition-all duration-300 hover:shadow-md"
                  >
                    Go to Dashboard
                  </Button>
                  <Button 
                    onClick={handleSignOut} // Use handleSignOut instead of router.push('/logout')
                    variant="outline"
                    className="text-gray-600 border-gray-300 hover:border-[#8b39ea] hover:text-[#8b39ea] text-sm transform hover:scale-105 transition-all duration-300"
                  >
                    Sign Out
                  </Button>
                </>
              ) : (
                <>
                  <Button 
                    variant="ghost" 
                    onClick={() => router.push('/login')}
                    className="text-gray-600 hover:text-[#8b39ea] text-sm transform hover:scale-105 transition-all duration-300 hover:shadow-md"
                  >
                    Sign In
                  </Button>
                  <Button 
                    onClick={() => router.push('/signup')}
                    className="bg-gradient-to-r from-[#8b39ea] to-[#137fc8] hover:from-[#7a2dd4] hover:to-[#0f6cb0] text-white text-sm px-4 py-2 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl relative overflow-hidden group"
                  >
                    <span className="relative z-10">Get Started</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-[#7a2dd4] to-[#0f6cb0] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 px-4 relative">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center space-y-6">
            <div className={`transition-all duration-1000 delay-300 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                <span className="bg-gradient-to-r from-[#8b39ea] via-[#137fc8] to-[#1d4ed8] bg-clip-text text-transparent">
                  All-in-One Business
                </span>
                <br />
                <span className="text-gray-900">Intelligence Platform</span>
              </h1>
            </div>
            
            <div className={`transition-all duration-1000 delay-500 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
                Powerful tools for web scraping, email verification, lead management, 
                and more to help you grow your business efficiently.
              </p>
            </div>

            <div className={`flex flex-col sm:flex-row gap-3 justify-center items-center pt-6 transition-all duration-1000 delay-700 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
              <Button 
                size="lg"
                onClick={handleGoToDashboard}
                className="bg-gradient-to-r from-[#8b39ea] to-[#137fc8] hover:from-[#7a2dd4] hover:to-[#0f6cb0] text-white px-6 py-4 text-base transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl relative overflow-hidden group"
              >
                <span className="relative z-10 flex items-center">
                  {user ? 'Go to Dashboard' : 'Start Free Trial'} 
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-[#7a2dd4] to-[#0f6cb0] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                className="px-6 py-4 text-base border-2 transform hover:scale-105 transition-all duration-300 hover:shadow-lg hover:border-[#8b39ea] hover:text-[#8b39ea]"
              >
                Watch Demo
              </Button>
            </div>

            {/* Animated Stats */}
            <div className={`grid grid-cols-2 md:grid-cols-4 gap-6 pt-12 max-w-3xl mx-auto transition-all duration-1000 delay-900 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
              {[
                { number: '10K+', label: 'Active Users' },
                { number: '95%', label: 'Success Rate' },
                { number: '50M+', label: 'Leads Generated' },
                { number: '24/7', label: 'Support' }
              ].map((stat, index) => (
                <div key={index} className="text-center transform hover:scale-110 transition-transform duration-300">
                  <div className="text-xl md:text-2xl font-bold text-[#1d4ed8]">{stat.number}</div>
                  <div className="text-gray-600 text-xs mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Overview Section */}
      <section className="py-16 bg-white/50 backdrop-blur-sm px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center space-y-3 mb-8">
            <h2 className="text-3xl font-bold text-gray-900">
              Powerful Features for <span className="text-[#8b39ea]">Business Growth</span>
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Comprehensive suite of tools to streamline workflow and maximize productivity
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: <Database className="w-6 h-6" />,
                title: 'Web Scraping',
                description: 'Extract valuable data from any website with advanced web scraping technology.',
                color: 'from-[#8b39ea] to-[#137fc8]',
              },
              {
                icon: <Rocket className="w-6 h-6" />,
                title: 'Apollo Scraping',
                description: 'Access and extract data from Apollo.io with precision and efficiency.',
                color: 'from-[#137fc8] to-[#1d4ed8]',
              },
              {
                icon: <Mail className="w-6 h-6" />,
                title: 'Email Verifier',
                description: 'Verify email addresses in real-time to improve deliverability.',
                color: 'from-[#1d4ed8] to-[#8b39ea]',
              },
              {
                icon: <TrendingUp className="w-6 h-6" />,
                title: 'Sales Navigator',
                description: 'Identify and connect with potential clients using sales intelligence.',
                color: 'from-[#8b39ea] to-[#137fc8]',
              },
              {
                icon: <Zap className="w-6 h-6" />,
                title: 'Email Warmup',
                description: 'Increase email sending reputation with automated warmup process.',
                color: 'from-[#137fc8] to-[#1d4ed8]',
              },
              {
                icon: <Users className="w-6 h-6" />,
                title: 'Lead Management',
                description: 'Organize, track, and nurture leads through sales pipeline.',
                color: 'from-[#1d4ed8] to-[#8b39ea]',
              }
            ].map((feature, index) => (
              <Card key={index} className="group hover:shadow-xl transition-all duration-500 border-0 shadow-md hover:border-[#8b39ea]/20 border-2 border-transparent transform hover:-translate-y-2">
                <CardContent className="p-5 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-transparent to-purple-50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  
                  <div className={`bg-gradient-to-r ${feature.color} p-2 rounded-lg w-fit text-white mb-3 group-hover:scale-110 transition-transform duration-300 relative z-10 transform group-hover:rotate-6`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 relative z-10 group-hover:text-[#8b39ea] transition-colors duration-300">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed relative z-10">
                    {feature.description}
                  </p>
                  
                  <div className="absolute bottom-0 left-0 w-0 h-1 bg-gradient-to-r from-[#8b39ea] to-[#137fc8] group-hover:w-full transition-all duration-500"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-[#8b39ea] to-[#1d4ed8] px-4 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-20 h-20 bg-white/10 rounded-full animate-pulse"></div>
          <div className="absolute bottom-0 right-0 w-16 h-16 bg-white/10 rounded-full animate-pulse delay-1000"></div>
        </div>
        
        <div className="container mx-auto max-w-3xl text-center text-white relative z-10">
          <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Business?</h2>
          <p className="text-lg mb-6 opacity-90 max-w-xl mx-auto">
            Join thousands of businesses using Globo Polo to streamline operations and drive growth.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button 
              size="lg"
              onClick={handleGoToDashboard}
              className="bg-white text-[#8b39ea] hover:bg-gray-100 px-6 py-4 text-base font-semibold transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl relative overflow-hidden group"
            >
              <span className="relative z-10">
                {user ? 'Go to Dashboard' : 'Start Free Trial'}
              </span>
              <div className="absolute inset-0 bg-gray-100 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              className="border-white text-black hover:bg-white/10 px-6 py-4 text-base transform hover:scale-105 transition-all duration-300 hover:bg-white hover:text-[#8b39ea]"
            >
              Schedule Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-10 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-3 select-none whitespace-nowrap overflow-hidden mb-4 md:mb-0">
              <div className="relative flex-shrink-0">
                <div className="relative p-2 bg-gradient-to-br from-[#8b39ea] via-[#137fc8] to-[#1d4ed8] rounded-lg shadow-lg transform hover:scale-105 transition-transform duration-300">
                  <Orbit className="w-5 h-5 text-white" />
                  <div className="absolute -top-1 -right-1">
                    <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-ping"></div>
                    <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full absolute top-0 right-0"></div>
                  </div>
                </div>
              </div>
              <span className="text-2xl font-bold">Globo Polo</span>
            </div>
            <div className="text-gray-400 text-center md:text-right text-sm">
              <p>&copy; 2025 Globo Polo. All rights reserved.</p>
              <p className="text-xs mt-1">All-in-One Business Intelligence Platform</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Dashboard Content Component
function DashboardContent({ user, onShowLanding }: { user: any; onShowLanding: () => void }) {
  const [activeTab, setActiveTab] = useState("apollo-scraper");
  const [collapsed, setCollapsed] = useState(false);

  const handleToggleCollapse = () => {
    setCollapsed(!collapsed);
  };

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
          onShowLanding={onShowLanding}
        />
      </div>

      {/* Main content */}
      <div className="flex flex-col min-w-0 overflow-hidden">
        <Header collapsed={collapsed} onShowLanding={onShowLanding} user={user} />
        <div className="flex-1 overflow-y-auto">
          <div className="p-2">{renderTabContent()}</div>
        </div>
      </div>
    </div>
  );
}