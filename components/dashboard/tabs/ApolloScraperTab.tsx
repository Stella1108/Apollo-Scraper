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
  // add any other user properties your app uses
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
  const pageSize = 10;

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
          date: new Date(r.created_at).toISOString().split("T")[0],
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
      toast.error(err.message || "Failed to load requests");
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
          fileName,
          fileFormat,
          user_id: user.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        if (errorData?.error === "apollo_scraper_overloaded") {
          toast.error(
            "The Apollo service is currently experiencing high traffic. Please try again in a few minutes."
          );
        } else {
          toast.error(errorData?.message || "Error submitting scraping request");
        }
        setLoading(false);
        return;
      }

      const newRequest: ScraperRequest = await response.json();

      let attempts = 0;
      const maxAttempts = 20;
      const pollInterval = 3000;

      while (attempts < maxAttempts) {
        await new Promise((res) => setTimeout(res, pollInterval));
        attempts++;
        await fetchRequests();

        const current = requestsRef.current.find((r) => r.id === newRequest.id);
        if (current) {
          if (current.status === "completed") {
            toast.success("Scraping completed! Download your file below.");
            resetForm();
            break;
          } else if (current.status === "failed") {
            toast.error("Scraping failed. Please try again.");
            break;
          }
        }
      }
    } catch (err: any) {
      toast.error(`Failed to submit scraping request: ${err.message}`);
    } finally {
      setLoading(false);
    }
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
    toast("Refreshed requests list", { duration: 2000 });
  };

  const getStatusBadge = (status: ScraperRequest["status"]) => {
    const variants = {
      pending: "bg-yellow-100 text-yellow-800",
      processing: "bg-blue-100 text-blue-800",
      completed: "bg-green-100 text-green-800",
      failed: "bg-red-100 text-red-800",
    };
    const icons = {
      pending: <RefreshCcw className="inline w-4 h-4 mr-1" />,
      processing: <Loader2 className="inline w-4 h-4 mr-1 animate-spin" />,
      completed: <CheckCircle className="inline w-4 h-4 mr-1" />,
      failed: <XCircle className="inline w-4 h-4 mr-1" />,
    };

    return (
      <Badge
        className={`${variants[status]} flex items-center justify-center gap-1 px-3 py-1`}
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
    if (!showAll) return filtered.slice(0, 10);
    const startIdx = (currentPage - 1) * pageSize;
    return filtered.slice(startIdx, startIdx + pageSize);
  }, [filtered, showAll, currentPage]);

  return (
    <div className="space-y-8 max-w-8xl mx-auto p-4 w-full">
      <h2 className="text-4xl font-bold text-blue-700 mb-4">Apollo Scraper</h2>
      <p className="mb-6 text-gray-700">
        Extract high-quality leads from Apollo with precision
      </p>

      {/* New Scraping Request Form */}
      <Card className="shadow-md border border-gray-300 hover:shadow-lg transition-shadow duration-300 w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-700">
            <Rocket className="w-6 h-6" />
            New Scraping Request
          </CardTitle>
          <CardDescription>Enter URL and specify leads count</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6 w-full">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 w-full">
              <div className="space-y-1 w-full">
                <Label htmlFor="url" className="font-semibold text-blue-700">
                  Apollo URL
                </Label>
                <Input
                  id="url"
                  type="url"
                  placeholder="https://app.apollo.io/#/people?..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1 w-full">
                <Label htmlFor="leadsCount" className="font-semibold text-blue-700">
                  Number of Leads
                </Label>
                <Input
                  id="leadsCount"
                  type="number"
                  placeholder="10"
                  value={leadsCount}
                  onChange={(e) => setLeadsCount(e.target.value)}
                  required
                  min={1}
                />
              </div>
              <div className="space-y-1 w-full">
                <Label htmlFor="fileName" className="font-semibold text-blue-700">
                  File Name (Optional)
                </Label>
                <Input
                  id="fileName"
                  type="text"
                  placeholder="my_leads.csv"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                />
              </div>
              <div className="space-y-1 w-full">
                <Label htmlFor="fileFormat" className="font-semibold text-blue-700">
                  Export Format
                </Label>
                <Select
                  value={fileFormat}
                  onValueChange={(v) => setFileFormat(v as "csv" | "xlsx")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="csv">CSV</SelectItem>
                    <SelectItem value="xlsx">Excel</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="mt-4">
              <Button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-md shadow-md transition duration-300 w-auto"
                size="sm"
              >
                {loading ? (
                  <>
                    <Loader2 className="inline mr-2 h-5 w-5 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Start Scraping"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Requests Table & Pagination */}
      <Card className="shadow-md border border-gray-300 hover:shadow-lg transition-shadow duration-300 w-full">
        <CardHeader>
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-xl font-semibold text-blue-700">Recent Requests</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              className="flex items-center gap-1 text-blue-600"
            >
              <RefreshCcw className="w-5 h-5" />
              Refresh
            </Button>
          </div>
          <CardDescription>View and download your scraping results</CardDescription>
          <div className="mt-3">
            <Input
              type="search"
              placeholder="Search by file name..."
              value={filterFileName}
              onChange={(e) => setFilterFileName(e.target.value)}
              className="rounded-md"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto rounded-md border border-gray-300 w-full mb-4">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="text-blue-700">Date</TableHead>
                  <TableHead className="text-blue-700">File Name</TableHead>
                  <TableHead className="text-blue-700">Search Link</TableHead>
                  <TableHead className="text-blue-700">Status</TableHead>
                  <TableHead className="text-blue-700">Requested</TableHead>
                  <TableHead className="text-blue-700">Extracted</TableHead>
                  <TableHead className="text-blue-700">Credits</TableHead>
                  <TableHead className="text-blue-700 text-right">Export</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayRequests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-gray-400 py-8">
                      No scraping requests match your search.
                    </TableCell>
                  </TableRow>
                ) : (
                  displayRequests.map((request) => (
                    <TableRow
                      key={request.id}
                      className="hover:bg-gray-100 transition-colors cursor-pointer"
                      title="Click to open search link"
                    >
                      <TableCell className="font-medium text-blue-800">{request.date}</TableCell>
                      <TableCell className="text-blue-700">{request.fileName}</TableCell>
                      <TableCell className="text-blue-600 flex items-center gap-1">
                        <LinkIcon className="w-4 h-4" />
                        <a
                          href={request.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline hover:text-blue-900"
                          onClick={(e) => e.stopPropagation()}
                        >
                          View
                        </a>
                      </TableCell>
                      <TableCell>{getStatusBadge(request.status)}</TableCell>
                      <TableCell className="text-blue-700 font-semibold">{request.requested}</TableCell>
                      <TableCell className="text-blue-700 font-semibold">{request.extracted}</TableCell>
                      <TableCell className="text-blue-700 font-semibold">{request.credits}</TableCell>
                      <TableCell className="text-right">
                        {request.status === "completed" && request.downloadLink ? (
                          <a
                            href={request.downloadLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            aria-label={`Download ${request.fileName}`}
                            className="inline-flex items-center justify-center p-1 hover:bg-blue-50 hover:text-blue-700 rounded transition-transform transform hover:scale-125"
                            download={request.fileName}
                          >
                            <Download className="w-5 h-5" />
                          </a>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {showAll && totalPages > 1 && (
            <div className="flex justify-center items-center mt-4 gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-gray-700">
                Page {currentPage} of {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}

          <div className="mt-4 flex justify-center">
            <button
              onClick={() => {
                if (!showAll) {
                  setShowAll(true);
                  setCurrentPage(1);
                } else {
                  setShowAll(false);
                }
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              {showAll ? "Show Less" : "View All"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
