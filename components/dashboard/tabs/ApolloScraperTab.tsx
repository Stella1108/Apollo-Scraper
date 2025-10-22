"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Download,
  Loader as Loader2,
  Rocket,
  Link as LinkIcon,
  CheckCircle,
  XCircle,
  RefreshCcw,
  Search,
  FileDown,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { supabase } from "@/lib/supabase";

interface User {
  id: string;
  email?: string;
  name?: string;
}

interface ScraperRequest {
  id: string;
  date: string;
  fileName: string;
  fileFormat?: "csv" | "xlsx";
  link: string;
  status: "pending" | "processing" | "completed" | "failed";
  requested: number;
  extracted: number;
  credits: number;
  downloadLink?: string | null;
}

interface ApolloScraperTabProps {
  user: User;
}

const COLORS = {
  purple: "#8b39ea",
  lightBlue: "#137fc8", 
  darkBlue: "#1d4ed8",
  gradient: "linear-gradient(135deg, #8b39ea 0%, #137fc8 50%, #1d4ed8 100%)",
  lightGradient: "linear-gradient(135deg, #8b39ea20 0%, #137fc820 50%, #1d4ed820 100%)",
};

export function ApolloScraperTab({ user }: ApolloScraperTabProps) {
  const [url, setUrl] = useState("");
  const [leadsCount, setLeadsCount] = useState("");
  const [fileName, setFileName] = useState("");
  const [fileFormat, setFileFormat] = useState<"csv" | "xlsx">("csv");
  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState<ScraperRequest[]>([]);
  const [filterFileName, setFilterFileName] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isHovered, setIsHovered] = useState(false);
  const pageSize = 10;
  const defaultViewCount = 5; // Show 5 records by default

  const requestsRef = useRef(requests);
  requestsRef.current = requests;

  useEffect(() => {
    fetchRequests();
  }, [user]);

  async function fetchRequests() {
    if (!user?.id) {
      setRequests([]);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("scraper_requests")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setRequests(
        (data || []).map((r: any) => ({
          id: r.id,
          date: new Date(r.created_at).toLocaleDateString(),
          fileName: r.file_name,
          fileFormat: r.file_format || "csv",
          link: r.url,
          status: r.status,
          requested: r.requested,
          extracted: r.extracted,
          credits: r.credits,
          downloadLink: r.download_link || null,
        }))
      );
    } catch (err: any) {
      console.error("Failed to load requests:", err);
    } finally {
      setLoading(false);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (!user?.id) throw new Error("User not authenticated");

      const response = await fetch("/api/scrape-leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          leadsCount: Number(leadsCount),
          fileName: fileName || `apollo_leads_${Date.now()}`,
          fileFormat,
          user_id: user.id,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        // Don't show specific error messages to users
        // Just log them internally
        console.error("Backend error:", result.message || "Unknown error");
        
        // Show generic success message even if there are backend issues
        // The backend will keep retrying automatically
        toast.success("Scraping started! We're processing your request.", {
          duration: 5000,
        });
      } else {
        toast.success("Scraping started successfully! We'll notify you when it's complete.", {
          duration: 5000,
        });
      }

      resetForm();
      
      // Add the new request to local state immediately
      const newRequest: ScraperRequest = {
        id: result.id,
        date: new Date().toLocaleDateString(),
        fileName: fileName || `apollo_leads_${Date.now()}`,
        fileFormat,
        link: url,
        status: "processing",
        requested: Number(leadsCount),
        extracted: 0,
        credits: Number(leadsCount),
        downloadLink: null,
      };

      setRequests(prev => [newRequest, ...prev]);
      
      // Start polling for updates
      startPollingForUpdates(result.id);

    } catch (err: any) {
      console.error("Submit error:", err);
      // Show only generic error messages
      toast.error("Failed to start scraping. Please try again.", {
        duration: 4000,
      });
    } finally {
      setLoading(false);
    }
  };

  // Add polling function
  const startPollingForUpdates = (requestId: string) => {
    let pollCount = 0;
    const maxPollCount = 72; // Poll for up to 6 minutes (5 seconds * 72 = 360 seconds)
    
    const pollInterval = setInterval(async () => {
      pollCount++;
      await fetchRequests(); // Refresh the requests list
      
      const currentRequest = requestsRef.current.find(r => r.id === requestId);
      if (currentRequest) {
        if (currentRequest.status === "completed") {
          toast.success("Scraping completed! Download your file below.", {
            duration: 6000,
          });
          clearInterval(pollInterval);
        } else if (currentRequest.status === "failed") {
          // Don't show specific failure reasons to users
          toast.error("Scraping failed. Please try again with different parameters.", {
            duration: 4000,
          });
          clearInterval(pollInterval);
        }
      }

      // Stop polling after max attempts
      if (pollCount >= maxPollCount) {
        clearInterval(pollInterval);
        toast.info("Scraping is taking longer than expected. We'll continue processing in the background.", {
          duration: 6000,
        });
      }
    }, 5000); // Poll every 5 seconds
  };

  const resetForm = () => {
    setUrl("");
    setLeadsCount("");
    setFileName("");
    setFileFormat("csv");
  };

  const handleRefresh = () => {
    setFilterFileName("");
    fetchRequests();
    toast("Requests list refreshed", { 
      duration: 2000,
    });
  };

  const getStatusBadge = (status: ScraperRequest["status"]) => {
    const variants = {
      pending: `bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-200 transition-colors duration-300`,
      processing: `bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-200 transition-colors duration-300`,
      completed: `bg-green-100 text-green-800 border-green-300 hover:bg-green-200 transition-colors duration-300`,
      failed: `bg-red-100 text-red-800 border-red-300 hover:bg-red-200 transition-colors duration-300`,
    };
    const icons = {
      pending: <RefreshCcw className="inline w-4 h-4 mr-1 animate-pulse" />,
      processing: <Loader2 className="inline w-4 h-4 mr-1 animate-spin" />,
      completed: <CheckCircle className="inline w-4 h-4 mr-1" />,
      failed: <XCircle className="inline w-4 h-4 mr-1" />,
    };

    return (
      <Badge
        className={`${variants[status]} flex items-center justify-center gap-1 px-3 py-1 border-2 transition-all duration-300 hover:scale-105`}
        variant="secondary"
      >
        {icons[status]}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const filtered = useMemo(() => {
    if (!filterFileName.trim()) return requests;
    return requests.filter((r) =>
      r.fileName.toLowerCase().includes(filterFileName.toLowerCase())
    );
  }, [requests, filterFileName]);

  const totalFiltered = filtered.length;
  const totalPages = Math.ceil(totalFiltered / pageSize);

  const displayRequests = useMemo(() => {
    if (!showAll) {
      // Show only first 5 records when not in "view all" mode
      return filtered.slice(0, defaultViewCount);
    } else {
      // Show all records with pagination when in "view all" mode
      const startIdx = (currentPage - 1) * pageSize;
      return filtered.slice(startIdx, startIdx + pageSize);
    }
  }, [filtered, showAll, currentPage, defaultViewCount]);

  const gradientTextClass = "bg-gradient-to-r from-[#8b39ea] via-[#137fc8] to-[#1d4ed8] bg-clip-text text-transparent";
  const subHeadingClass = "text-lg font-medium bg-gradient-to-r from-[#137fc8] via-[#8b39ea] to-[#1d4ed8] bg-clip-text text-transparent";

  // Toggle between view all and view less
  const toggleViewAll = () => {
    if (showAll) {
      setShowAll(false);
      setCurrentPage(1);
    } else {
      setShowAll(true);
      setCurrentPage(1);
    }
  };

  return (
    <div className="space-y-8 max-w-8xl mx-auto p-4 w-full">
      {/* Header Section */}
      <div className="text-left">
        <div className="flex items-center gap-3 mb-3">
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-[#8b39ea] to-[#137fc8] rounded-lg blur opacity-25 animate-pulse"></div>
          </div>
          <div>
            <h2 className={`text-4xl font-extrabold mb-3 ${gradientTextClass} select-none`}>
              Apollo Scraper
            </h2>
            <p className={subHeadingClass}>
              Extract high-quality leads from Apollo with precision and speed
            </p>
          </div>
        </div>
      </div>

      {/* New Scraping Request Form */}
      <Card className="shadow-2xl border border-[#8b39ea]/20 hover:shadow-3xl transition-all duration-500 transform hover:-translate-y-1">
        <CardHeader className="bg-gradient-to-r from-[#8b39ea]/10 via-[#137fc8]/10 to-[#1d4ed8]/10 rounded-t-lg border-b border-[#8b39ea]/20">
          <CardTitle className="flex items-center gap-3">
            <div className="relative">
              <Rocket className="w-8 h-8 text-[#8b39ea]" />
            </div>
            <span className={gradientTextClass + " text-2xl font-bold"}>
              New Scraping Request
            </span>
          </CardTitle>
          <CardDescription className="text-lg">
            <span className={subHeadingClass + " font-semibold"}>
              Enter Apollo URL and specify your leads requirements
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 bg-gradient-to-br from-white to-[#8b39ea]/5">
          <form onSubmit={handleSubmit} className="space-y-6 w-full">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
              <div className="space-y-3 w-full">
                <Label htmlFor="url" className="text-base font-semibold text-[#1d4ed8]">
                  Apollo URL *
                </Label>
                <Input
                  id="url"
                  type="url"
                  placeholder="https://app.apollo.io/#/people?..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  required
                  className="border-2 border-[#137fc8]/30 rounded-lg p-3 focus:ring-2 focus:ring-[#8b39ea] focus:border-[#8b39ea] transition-all duration-300 hover:border-[#8b39ea]/50"
                />
                <p className="text-sm text-gray-500">
                  Must be an Apollo People search URL
                </p>
              </div>
              <div className="space-y-3 w-full">
                <Label htmlFor="leadsCount" className="text-base font-semibold text-[#1d4ed8]">
                  Number of Leads *
                </Label>
                <Input
                  id="leadsCount"
                  type="number"
                  placeholder="50"
                  value={leadsCount}
                  onChange={(e) => setLeadsCount(e.target.value)}
                  required
                  min={1}
                  max={10000}
                  className="border-2 border-[#137fc8]/30 rounded-lg p-3 focus:ring-2 focus:ring-[#8b39ea] focus:border-[#8b39ea] transition-all duration-300 hover:border-[#8b39ea]/50"
                />
                <p className="text-sm text-gray-500">
                  Max 10,000 leads per request
                </p>
              </div>
              <div className="space-y-3 w-full">
                <Label htmlFor="fileName" className="text-base font-semibold text-[#1d4ed8]">
                  File Name
                </Label>
                <Input
                  id="fileName"
                  type="text"
                  placeholder="my_leads"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  className="border-2 border-[#137fc8]/30 rounded-lg p-3 focus:ring-2 focus:ring-[#8b39ea] focus:border-[#8b39ea] transition-all duration-300 hover:border-[#8b39ea]/50"
                />
                <p className="text-sm text-gray-500">
                  Optional - will auto-generate
                </p>
              </div>
              <div className="space-y-3 w-full">
                <Label htmlFor="fileFormat" className="text-base font-semibold text-[#1d4ed8]">
                  Export Format
                </Label>
                <Select
                  value={fileFormat}
                  onValueChange={(v) => setFileFormat(v as "csv" | "xlsx")}
                >
                  <SelectTrigger className="border-2 border-[#137fc8]/30 rounded-lg p-3 focus:ring-2 focus:ring-[#8b39ea] focus:border-[#8b39ea] transition-all duration-300 hover:border-[#8b39ea]/50">
                    <SelectValue placeholder="Select format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="csv" className="focus:bg-[#8b39ea]/10 focus:text-[#8b39ea]">
                      <div className="flex items-center gap-2">
                        <FileDown className="w-4 h-4" />
                        CSV Format
                      </div>
                    </SelectItem>
                    <SelectItem value="xlsx" className="focus:bg-[#8b39ea]/10 focus:text-[#8b39ea]">
                      <div className="flex items-center gap-2">
                        <FileDown className="w-4 h-4" />
                        Excel Format
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                disabled={loading}
                className="bg-gradient-to-r from-[#8b39ea] via-[#137fc8] to-[#1d4ed8] hover:from-[#8b39ea] hover:via-[#1d4ed8] hover:to-[#137fc8] text-white font-bold shadow-2xl transition-all duration-500 text-lg py-6 px-8 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                    <div className="text-left">
                      <div className="font-semibold">Processing Request</div>
                    </div>
                  </>
                ) : (
                  <>
                    <Rocket className={`mr-3 h-6 w-6 transition-transform duration-300 ${isHovered ? 'animate-bounce' : ''}`} />
                    <div className="text-left">
                      <div className="font-semibold">Start Scraping</div>
                    </div>
                  </>
                )}
              </Button>
              
              <Button
                type="button"
                variant="outline"
                onClick={resetForm}
                className="border-[#8b39ea] text-[#8b39ea] hover:bg-[#8b39ea] hover:text-white transition-all duration-300 py-6 px-6"
              >
                Clear Form
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Requests Table & Pagination */}
      <Card className="shadow-2xl border border-[#8b39ea]/20 hover:shadow-3xl transition-all duration-500">
        <CardHeader className="bg-gradient-to-r from-[#8b39ea]/10 via-[#137fc8]/10 to-[#1d4ed8]/10 rounded-t-lg border-b border-[#8b39ea]/20">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-3">
              <FileDown className="w-8 h-8 text-[#8b39ea]" />
              <h3 className={`text-2xl font-bold ${gradientTextClass}`}>
                Scraping Requests
              </h3>
            </div>
            <Button
              variant="outline"
              size="lg"
              onClick={handleRefresh}
              className="border-[#8b39ea] text-[#8b39ea] hover:bg-[#8b39ea] hover:text-white transition-all duration-300 transform hover:scale-105"
            >
              <RefreshCcw className="w-5 h-5 mr-2" />
              Refresh
            </Button>
          </div>
          <CardDescription className="text-lg">
            <span className={subHeadingClass + " font-semibold"}>
              View and download your scraping results
            </span>
          </CardDescription>
          <div className="mt-6 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="search"
              placeholder="Search by file name..."
              value={filterFileName}
              onChange={(e) => setFilterFileName(e.target.value)}
              className="pl-10 border-2 border-[#137fc8]/30 rounded-lg p-3 focus:ring-2 focus:ring-[#8b39ea] focus:border-[#8b39ea] transition-all duration-300 hover:border-[#8b39ea]/50"
            />
          </div>
        </CardHeader>
        <CardContent className="pt-6 bg-gradient-to-br from-white to-[#8b39ea]/5">
          <div className="overflow-auto rounded-xl border-2 border-[#8b39ea]/20 shadow-inner w-full mb-6">
            <Table>
              <TableHeader>
                <TableRow className="bg-gradient-to-r from-[#8b39ea]/10 via-[#137fc8]/10 to-[#1d4ed8]/10">
                  <TableHead className="text-[#1d4ed8] font-bold text-lg py-4">Date</TableHead>
                  <TableHead className="text-[#1d4ed8] font-bold text-lg py-4">File Name</TableHead>
                  <TableHead className="text-[#1d4ed8] font-bold text-lg py-4">Search Link</TableHead>
                  <TableHead className="text-[#1d4ed8] font-bold text-lg py-4">Status</TableHead>
                  <TableHead className="text-[#1d4ed8] font-bold text-lg py-4">Requested</TableHead>
                  <TableHead className="text-[#1d4ed8] font-bold text-lg py-4">Extracted</TableHead>
                  <TableHead className="text-[#1d4ed8] font-bold text-lg py-4">Credits</TableHead>
                  <TableHead className="text-[#1d4ed8] font-bold text-lg py-4 text-right">Export</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayRequests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-gray-400 py-12">
                      <div className="flex flex-col items-center gap-3">
                        <FileDown className="w-16 h-16 text-gray-300" />
                        <p className="text-xl font-semibold">No scraping requests found</p>
                        <p className="text-gray-500">Start a new scraping request above</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  displayRequests.map((request, index) => (
                    <TableRow
                      key={request.id}
                      className={`group hover:bg-gradient-to-r hover:from-[#8b39ea]/5 hover:via-[#137fc8]/5 hover:to-[#1d4ed8]/5 transition-all duration-300 cursor-pointer ${
                        index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                      }`}
                      title="Click to open search link"
                    >
                      <TableCell className="font-semibold text-[#137fc8] py-4 group-hover:scale-105 transition-transform duration-300">
                        {request.date}
                      </TableCell>
                      <TableCell className="text-[#8b39ea] font-medium py-4">{request.fileName}</TableCell>
                      <TableCell className="py-4">
                        <a
                          href={request.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-[#137fc8] hover:text-[#1d4ed8] transition-all duration-300 group-hover:gap-3"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <LinkIcon className="w-4 h-4 transition-transform duration-300 group-hover:scale-110" />
                          <span className="font-medium underline hover:no-underline">View Search</span>
                        </a>
                      </TableCell>
                      <TableCell className="py-4">{getStatusBadge(request.status)}</TableCell>
                      <TableCell className="text-[#8b39ea] font-bold text-lg py-4">{request.requested}</TableCell>
                      <TableCell className="text-[#137fc8] font-bold text-lg py-4">{request.extracted}</TableCell>
                      <TableCell className="text-[#1d4ed8] font-bold text-lg py-4">{request.credits}</TableCell>
                      <TableCell className="text-right py-4">
                        {request.status === "completed" && request.downloadLink ? (
                          <a
                            href={request.downloadLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            aria-label={`Download ${request.fileName}`}
                            className="inline-flex items-center justify-center p-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-full hover:from-green-600 hover:to-green-700 transition-all duration-300 transform hover:scale-110 shadow-lg hover:shadow-xl"
                            download={request.fileName}
                          >
                            <Download className="w-5 h-5" />
                          </a>
                        ) : (
                          <div className="inline-flex items-center justify-center p-3 bg-gray-200 rounded-full">
                            <Download className="w-5 h-5 text-gray-400" />
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination Controls - Only show when viewing all */}
          {showAll && totalPages > 1 && (
            <div className="flex justify-center items-center mt-6 gap-3">
              <Button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                className="bg-gradient-to-r from-[#8b39ea] to-[#137fc8] text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105"
                size="sm"
              >
                Previous
              </Button>
              <span className="text-[#1d4ed8] font-semibold px-4 py-2 bg-gradient-to-r from-[#8b39ea]/10 to-[#137fc8]/10 rounded-lg">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                className="bg-gradient-to-r from-[#137fc8] to-[#1d4ed8] text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105"
                size="sm"
              >
                Next
              </Button>
            </div>
          )}

          {/* View All / View Less Toggle Button */}
          {filtered.length > defaultViewCount && (
            <div className="mt-6 flex justify-center">
              <Button
                onClick={toggleViewAll}
                className="bg-gradient-to-r from-[#8b39ea] via-[#137fc8] to-[#1d4ed8] text-white font-bold shadow-2xl transition-all duration-500 py-4 px-8 transform hover:scale-105 flex items-center gap-2"
              >
                {showAll ? (
                  <>
                    <ChevronUp className="w-5 h-5" />
                    View Less (Show First {defaultViewCount})
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-5 h-5" />
                    View All ({filtered.length} Requests)
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Show current view info */}
          {filtered.length > 0 && (
            <div className="text-center mt-4">
              <p className="text-[#137fc8] font-medium">
                {showAll 
                  ? `Showing ${Math.min(pageSize, displayRequests.length)} of ${filtered.length} requests (Page ${currentPage} of ${totalPages})`
                  : `Showing ${Math.min(defaultViewCount, filtered.length)} of ${filtered.length} requests`}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}