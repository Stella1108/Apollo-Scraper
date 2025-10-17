// components/dashboard/tabs/WebScrapingTab.tsx
"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLinkIcon } from "lucide-react";

interface WebScrapingTabProps {
  user: any; // Add user prop interface
}

export default function WebScrapingTab({ user }: WebScrapingTabProps) {
  const goToWebsite = () => {
    window.open("https://work-scrapper.onrender.com", "_blank");
  };

  return (
    <div className="container mx-auto p-6">
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl flex items-center justify-center gap-2">
            Web Scraper
            <ExternalLinkIcon className="w-5 h-5" />
          </CardTitle>
          <CardDescription>
            Welcome back, {user?.name || 'User'}! Click below to open the web scraper.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-4">
          <Button
            onClick={goToWebsite}
            size="lg"
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg"
          >
            <ExternalLinkIcon className="mr-2 h-5 w-5" />
            Open Web Scraper
          </Button>
          
          <p className="text-sm text-muted-foreground text-center">
            This will open https://work-scrapper.onrender.com in a new browser tab
          </p>
        </CardContent>
      </Card>
    </div>
  );
}