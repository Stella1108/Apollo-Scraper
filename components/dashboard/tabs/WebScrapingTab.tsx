// components/dashboard/tabs/WebScrapingTab.tsx
"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Globe,
  Download,
  Play,
  Square,
  Loader2,
  Settings,
  FileText,
  Database,
  Link,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Copy,
  ExternalLink,
  Mail,
  Phone,
  Building,
} from "lucide-react";

interface User {
  id: string;
  email?: string;
  name?: string;
}

interface ScrapingResult {
  id: string;
  url: string;
  title: string;
  description: string;
  emails: string[];
  phones: string[];
  socialLinks: string[];
  companyInfo?: {
    name: string;
    industry: string;
    employees: string;
    founded: string;
  };
  timestamp: number;
  status: "success" | "partial" | "failed";
}

export function WebScrapingTab({ user }: { user: User }) {
  const [urls, setUrls] = useState("");
  const [scrapingType, setScrapingType] = useState("contact");
  const [isScraping, setIsScraping] = useState(false);
  const [results, setResults] = useState<ScrapingResult[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [concurrentRequests, setConcurrentRequests] = useState(5);
  const [requestDelay, setRequestDelay] = useState(2000);
  const [maxPages, setMaxPages] = useState(10);

  const startScraping = async () => {
    const urlList = urls
      .split("\n")
      .map(url => url.trim())
      .filter(url => url.length > 0 && isValidUrl(url));

    if (urlList.length === 0) {
      toast.error("Please enter valid URLs");
      return;
    }

    setIsScraping(true);
    setResults([]);

    try {
      // Simulate scraping process
      for (let i = 0; i < urlList.length; i++) {
        const url = urlList[i];
        
        // Simulate API call
        const result = await scrapeSingleUrl(url, scrapingType);
        setResults(prev => [...prev, result]);

        // Delay between requests
        if (i < urlList.length - 1) {
          await new Promise(resolve => setTimeout(resolve, requestDelay));
        }
      }

      toast.success(`Successfully scraped ${urlList.length} URLs`);
      
    } catch (error) {
      console.error("Scraping error:", error);
      toast.error("Scraping failed. Please try again.");
    } finally {
      setIsScraping(false);
    }
  };

  const stopScraping = () => {
    setIsScraping(false);
    toast.info("Scraping stopped");
  };

  const exportResults = (format: "csv" | "json") => {
    if (results.length === 0) {
      toast.error("No results to export");
      return;
    }

    let data = "";
    
    if (format === "csv") {
      data = generateCSV(results);
    } else {
      data = JSON.stringify(results, null, 2);
    }

    const blob = new Blob([data], { type: format === "csv" ? "text/csv" : "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `web-scraping-results-${new Date().toISOString().split("T")[0]}.${format}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);

    toast.success(`Results exported as ${format.toUpperCase()}`);
  };

  const isValidUrl = (string: string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const scrapeSingleUrl = async (url: string, type: string): Promise<ScrapingResult> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

    // Mock data - replace with actual API response
    return {
      id: `result_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      url,
      title: `Page Title for ${new URL(url).hostname}`,
      description: `Description extracted from ${url}`,
      emails: [`contact@${new URL(url).hostname}`, `info@${new URL(url).hostname}`],
      phones: ["+1-555-0123", "+1-555-0124"],
      socialLinks: [
        `https://linkedin.com/company/${new URL(url).hostname.split('.')[0]}`,
        `https://twitter.com/${new URL(url).hostname.split('.')[0]}`
      ],
      companyInfo: {
        name: `${new URL(url).hostname.split('.')[0].charAt(0).toUpperCase() + new URL(url).hostname.split('.')[0].slice(1)} Inc.`,
        industry: "Technology",
        employees: "50-200",
        founded: "2018"
      },
      timestamp: Date.now(),
      status: Math.random() > 0.1 ? "success" : "partial"
    };
  };

  const generateCSV = (results: ScrapingResult[]): string => {
    const headers = ["URL", "Title", "Emails", "Phones", "Social Links", "Status"];
    const rows = results.map(result => [
      result.url,
      result.title,
      result.emails.join("; "),
      result.phones.join("; "),
      result.socialLinks.join("; "),
      result.status
    ].map(field => `"${field.replace(/"/g, '""')}"`).join(","));
    
    return [headers.join(","), ...rows].join("\n");
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-3 mb-3">
          <Globe className="w-10 h-10 text-blue-600" />
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 bg-clip-text text-transparent">
            Web Scraping Suite
          </h1>
        </div>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Extract contact information, company data, and leads from websites automatically
        </p>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuration Panel */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Scraping Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Scraping Type</Label>
                <Select value={scrapingType} onValueChange={setScrapingType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="contact">Contact Information</SelectItem>
                    <SelectItem value="company">Company Data</SelectItem>
                    <SelectItem value="leads">Lead Generation</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>URLs to Scrape</Label>
                <Textarea
                  placeholder="https://example.com&#10;https://company.com"
                  value={urls}
                  onChange={(e) => setUrls(e.target.value)}
                  rows={6}
                  className="font-mono text-sm"
                  disabled={isScraping}
                />
                <div className="text-sm text-gray-500">
                  {urls.split('\n').filter(url => url.trim()).length} URLs
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={startScraping}
                  disabled={isScraping || urls.trim().length === 0}
                  className="flex-1"
                >
                  {isScraping ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Scraping...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Start
                    </>
                  )}
                </Button>
                
                {isScraping && (
                  <Button onClick={stopScraping} variant="outline">
                    <Square className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* Export Controls */}
          {results.length > 0 && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">Scraping Complete</h3>
                    <p className="text-gray-600">{results.length} websites processed</p>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => exportResults("csv")} variant="outline" size="sm">
                      <FileText className="w-4 h-4 mr-2" />
                      CSV
                    </Button>
                    <Button onClick={() => exportResults("json")} variant="outline" size="sm">
                      <Database className="w-4 h-4 mr-2" />
                      JSON
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Results List */}
          <div className="space-y-4">
            {results.map((result) => (
              <Card key={result.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Globe className="w-4 h-4 text-blue-500" />
                        <a href={result.url} target="_blank" className="text-blue-600 hover:underline font-medium">
                          {result.url}
                        </a>
                      </div>
                      <h4 className="font-semibold">{result.title}</h4>
                    </div>
                    <div className={`px-2 py-1 rounded text-xs ${
                      result.status === "success" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                    }`}>
                      {result.status}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Mail className="w-4 h-4 text-green-600" />
                        <span className="font-medium">Emails</span>
                      </div>
                      {result.emails.map((email, idx) => (
                        <div key={idx} className="text-green-700 ml-6">{email}</div>
                      ))}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Phone className="w-4 h-4 text-blue-600" />
                        <span className="font-medium">Phones</span>
                      </div>
                      {result.phones.map((phone, idx) => (
                        <div key={idx} className="text-blue-700 ml-6">{phone}</div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}