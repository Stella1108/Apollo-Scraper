"use client";

import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, Rocket, Zap, Download, Users, CheckCircle, ArrowRight } from "lucide-react";

interface WebScrapingTabProps {
  user: any;
}

export default function WebScrapingTab({ user }: WebScrapingTabProps) {
  useEffect(() => {
    // Add some interactive animations
    const featureCards = document.querySelectorAll('.feature-card');
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const target = entry.target as HTMLElement;
          target.style.opacity = '1';
          target.style.transform = 'translateY(0)';
        }
      });
    }, { threshold: 0.1 });
    
    featureCards.forEach(card => {
      const cardElement = card as HTMLElement;
      cardElement.style.opacity = '0';
      cardElement.style.transform = 'translateY(20px)';
      cardElement.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
      observer.observe(cardElement);
    });
  }, []);

  const goToWebsite = () => {
    window.open("https://work-scrapper.onrender.com", "_blank");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header Section */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-[#8b39ea] to-[#137fc8] rounded-full blur opacity-30"></div>
            
            </div>
<div>
  <h1 className="text-4xl font-bold bg-gradient-to-r from-[#8b39ea] via-[#137fc8] to-[#1d4ed8] bg-clip-text text-transparent mb-2 text-left">
    Web Scraper Pro
  </h1>
  <p className="text-lg text-gray-600 max-w-2xl text-left">
    Advanced Data Extraction Suite - Perfect Companion for Email Verification
  </p>
</div>
          </div>
        </div>

        {/* Hero Section */}
        <div className="grid lg:grid-cols-2 gap-12 items-center mb-20">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-6 leading-tight">
              Extract Quality Leads for{" "}
              <span className="bg-gradient-to-r from-[#8b39ea] to-[#137fc8] bg-clip-text text-transparent">
                Better Email Verification
              </span>
            </h2>
            <p className="text-base text-gray-600 mb-8 leading-relaxed">
              Combine the power of our web scraper with your email verification workflow. 
              Extract fresh leads from websites and verify them instantly for maximum conversion rates.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button 
                onClick={goToWebsite}
                className="bg-gradient-to-r from-[#8b39ea] to-[#137fc8] hover:from-[#8b39ea] hover:to-[#1d4ed8] text-white px-8 py-6 text-base font-semibold transition-all duration-300 hover:scale-105 shadow-xl"
                size="lg"
              >
                <Rocket className="w-5 h-5 mr-2" />
                Launch Web Scraper
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button 
                variant="outline" 
                className="px-8 py-6 text-base border-2 border-[#8b39ea] text-[#8b39ea] hover:bg-[#8b39ea] hover:text-white transition-all duration-300"
                size="lg"
              >
                <Download className="w-5 h-5 mr-2" />
                View Documentation
              </Button>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-r from-[#8b39ea] to-[#137fc8] rounded-2xl blur-xl opacity-20"></div>
            <img
              src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
              alt="Data Analytics Dashboard"
              className="relative rounded-xl shadow-2xl w-full h-80 object-cover"
            />
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
          <Card className="feature-card border-2 border-gray-100 hover:border-[#8b39ea]/30 hover:shadow-xl transition-all duration-500">
            <CardHeader>
              <div className="w-12 h-12 bg-gradient-to-r from-[#8b39ea] to-[#137fc8] rounded-lg flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-lg">Smart Lead Extraction</CardTitle>
              <CardDescription className="text-sm">
                Automatically extract emails, phone numbers, and contact information from any website
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Email pattern recognition
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Contact form detection
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Social media links
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="feature-card border-2 border-gray-100 hover:border-[#8b39ea]/30 hover:shadow-xl transition-all duration-500">
            <CardHeader>
              <div className="w-12 h-12 bg-gradient-to-r from-[#137fc8] to-[#1d4ed8] rounded-lg flex items-center justify-center mb-4">
                <Download className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-lg">Seamless Integration</CardTitle>
              <CardDescription className="text-sm">
                Export directly to your email verification pipeline with multiple format support
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  CSV, JSON, Excel formats
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  API integration ready
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Batch processing
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="feature-card border-2 border-gray-100 hover:border-[#8b39ea]/30 hover:shadow-xl transition-all duration-500">
            <CardHeader>
              <div className="w-12 h-12 bg-gradient-to-r from-[#1d4ed8] to-[#8b39ea] rounded-lg flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-lg">Quality Assurance</CardTitle>
              <CardDescription className="text-sm">
                Built-in validation to ensure high-quality data for your email verification
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Duplicate removal
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Format validation
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Data enrichment
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Workflow Section */}
        <Card className="mb-20 border-2 border-gray-100 shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl bg-gradient-to-r from-[#8b39ea] to-[#137fc8] bg-clip-text text-transparent">
              Integrated Workflow
            </CardTitle>
            <CardDescription className="text-base">
              How Web Scraping enhances your Email Verification process
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-6">
              {[
                { step: "1", title: "Extract", desc: "Scrape contact data from target websites" },
                { step: "2", title: "Export", desc: "Download clean, structured lead lists" },
                { step: "3", title: "Verify", desc: "Use Email Verifier to validate emails" },
                { step: "4", title: "Convert", desc: "Engage with verified, high-quality leads" }
              ].map((item, index) => (
                <div key={index} className="text-center p-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-[#8b39ea] to-[#137fc8] rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-4 shadow-lg">
                    {item.step}
                  </div>
                  <h3 className="font-semibold text-base text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-gray-600 text-sm">{item.desc}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Stats Section */}
        <div className="bg-gradient-to-r from-[#8b39ea] to-[#137fc8] rounded-2xl p-12 text-white mb-20 shadow-2xl">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold mb-2">50K+</div>
              <div className="text-blue-100 text-sm">Emails Verified Daily</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-2">95%</div>
              <div className="text-blue-100 text-sm">Accuracy Rate</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-2">10x</div>
              <div className="text-blue-100 text-sm">Faster Lead Generation</div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <Card className="text-center border-2 border-gray-100 shadow-2xl">
          <CardHeader className="pb-8">
            <CardTitle className="text-3xl font-bold text-gray-900 mb-4">
              Ready to Supercharge Your Lead Generation?
            </CardTitle>
            <CardDescription className="text-lg text-gray-600 max-w-2xl mx-auto">
              Combine the power of web scraping with email verification to build high-quality, validated lead lists that convert.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={goToWebsite}
              className="bg-gradient-to-r from-[#8b39ea] to-[#137fc8] hover:from-[#8b39ea] hover:to-[#1d4ed8] text-white px-12 py-8 text-lg font-semibold transition-all duration-300 hover:scale-105 shadow-2xl mb-4"
              size="lg"
            >
              <Rocket className="w-6 h-6 mr-3" />
              Launch Web Scraper Now
              <ArrowRight className="w-6 h-6 ml-3" />
            </Button>
            <p className="text-gray-500 text-sm">
              No credit card required • Free trial available
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}