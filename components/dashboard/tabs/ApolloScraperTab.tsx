"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Download, Loader as Loader2, Rocket, Link as LinkIcon, CheckCircle, XCircle, RefreshCcw,
} from "lucide-react";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";

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

export function ApolloScraperTab() {
  const [url, setUrl] = useState("");
  const [leadsCount, setLeadsCount] = useState("");
  const [fileName, setFileName] = useState("");
  const [fileFormat, setFileFormat] = useState<"csv" | "xlsx">("csv");
  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState<ScraperRequest[]>([]);
  const [filterFileName, setFilterFileName] = useState("");

  useEffect(() => {
    fetchRequests();
  }, []);

  async function fetchRequests() {
    setLoading(true);
    try {
      const response = await fetch("/api/fetch-scrape-requests");
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || "Failed to load requests");
      }
      const data = await response.json();
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
      toast.error(err.message || "Invalid response from server while loading requests.");
    } finally {
      setLoading(false);
    }
  }

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

  const filteredRequests = useMemo(() => {
    if (!filterFileName.trim()) return requests;
    return requests.filter((r) =>
      r.fileName.toLowerCase().includes(filterFileName.toLowerCase())
    );
  }, [requests, filterFileName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch("/api/scrape-leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, leadsCount: Number(leadsCount), fileName, fileFormat }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || "Error submitting scraping request");
      }

      await response.json();

      toast.success("Scraping request submitted successfully!");
      setUrl("");
      setLeadsCount("");
      setFileName("");
      setFileFormat("csv");
      fetchRequests();
    } catch (error: any) {
      toast.error(`Failed to submit scraping request: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setFilterFileName("");
    fetchRequests();
    toast("Refreshed requests list", { duration: 2000 });
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500 max-w-8xl mx-auto p-4 w-full">
      <h2 className="text-4xl font-bold text-blue-700 mb-4 select-none">Apollo Scraper</h2>
      <p className="text-gray-700 mb-6">Extract high-quality leads from Apollo with precision</p>
      {/* New Scraping Request form */}
      <Card className="shadow-md border border-gray-300 hover:shadow-lg transition-shadow duration-300 w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-700">
            <Rocket className="w-6 h-6" />
            New Scraping Request
          </CardTitle>
          <CardDescription className="text-gray-700">
            Enter the Apollo URL and specify the number of leads you want to extract
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6 w-full">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 w-full">
              <div className="space-y-1 w-full">
                <Label htmlFor="url" className="font-semibold text-blue-700">Apollo URL</Label>
                <Input
                  id="url"
                  type="url"
                  placeholder="https://app.apollo.io/..."
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1 w-full">
                <Label htmlFor="leadsCount" className="font-semibold text-blue-700">Number of Leads</Label>
                <Input
                  id="leadsCount"
                  type="number"
                  placeholder="100"
                  value={leadsCount}
                  onChange={e => setLeadsCount(e.target.value)}
                  required
                  min={1}
                />
              </div>
              <div className="space-y-1 w-full">
                <Label htmlFor="fileName" className="font-semibold text-blue-700">File Name (Optional)</Label>
                <Input
                  id="fileName"
                  type="text"
                  placeholder="my_leads.csv"
                  value={fileName}
                  onChange={e => setFileName(e.target.value)}
                />
              </div>
              <div className="space-y-1 w-full">
                <Label htmlFor="fileFormat" className="font-semibold text-blue-700">Export Format</Label>
                <Select value={fileFormat} onValueChange={value => setFileFormat(value as "csv" | "xlsx")}>
                  <SelectTrigger><SelectValue placeholder="Select format" /></SelectTrigger>
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
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-md shadow-md transition transform duration-300 hover:scale-105 active:scale-95 w-auto"
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
      {/* Recent Requests Table */}
      <Card className="shadow-md border border-gray-300 hover:shadow-lg transition-shadow duration-300 w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-blue-700">Recent Requests</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
              aria-label="Refresh requests"
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
              onChange={e => setFilterFileName(e.target.value)}
              className="rounded-md"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-gray-300 w-full overflow-auto">
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
                {filteredRequests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-gray-400 py-8">
                      No scraping requests match your search.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRequests.map(request => (
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
                          onClick={e => e.stopPropagation()}
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
                            onClick={e => e.stopPropagation()}
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
        </CardContent>
      </Card>
    </div>
  );
}
