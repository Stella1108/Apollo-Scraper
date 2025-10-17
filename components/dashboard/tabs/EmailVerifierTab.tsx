"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import {
  CheckCircle2,
  Loader2,
  XCircle as XCircleIcon,
  AlertTriangle,
  Download,
  Shield,
  MailCheck,
  Ban,
  Clock,
  Server,
  Mail,
  ShieldCheck,
  Zap,
  User,
  WifiOff,
  Globe,
  MailX,
  Sparkles,
  Rocket,
  BarChart3,
} from "lucide-react";

interface User {
  id: string;
  email?: string;
  name?: string;
}

interface VerificationResult {
  email: string;
  status: "ok" | "md" | "ko";
  details: string;
}

interface EmailVerifierTabProps {
  user: User;
}

// Custom color palette
const COLORS = {
  purple: "#8b39ea",
  lightBlue: "#137fc8", 
  darkBlue: "#1d4ed8",
  gradient: "linear-gradient(135deg, #8b39ea 0%, #137fc8 50%, #1d4ed8 100%)",
};

const statusPresets = {
  ok: {
    bg: "bg-gradient-to-r from-green-100 via-green-300 to-green-500 shadow-lg",
    color: "text-green-900",
    icon: CheckCircle2,
    badge: "border-green-500 bg-green-100",
    description: "Valid",
    text: "ACCEPT",
  },
  ko: {
    bg: "bg-gradient-to-r from-red-100 via-red-300 to-red-500 shadow-lg",
    color: "text-red-900",
    icon: XCircleIcon,
    badge: "border-red-500 bg-red-100",
    description: "Invalid",
    text: "REJECT",
  },
  md: {
    bg: "bg-gradient-to-r from-yellow-100 via-yellow-300 to-yellow-500 shadow",
    color: "text-yellow-900",
    icon: AlertTriangle,
    badge: "border-yellow-500 bg-yellow-100",
    description: "Unknown",
    text: "UNKNOWN",
  },
};

// Complete icon mapping for all email verifier statuses
const detailIcons: { [key: string]: any } = {
  // Valid statuses
  "accept": CheckCircle2,
  "valid": CheckCircle2,
  "catch_all": MailCheck,
  "low_risk": CheckCircle2,
  
  // Invalid statuses
  "reject": XCircleIcon,
  "invalid": XCircleIcon,
  "spam_block": Shield,
  "spam": Shield,
  "disposable": Ban,
  "high_risk": XCircleIcon,
  "invalid_format": XCircleIcon,
  
  // Unknown/Neutral statuses
  "unknown": AlertTriangle,
  "unverifiable": AlertTriangle,
  "role_account": User,
  "medium_risk": AlertTriangle,
  "no_catch_all": MailCheck,
  
  // Technical errors
  "timeout": Clock,
  "network_error": WifiOff,
  "service_error": Server,
  "mx_error": Server,
  "no_mx": Globe,
  "smtp_error": MailX,
  "verification_failed": XCircleIcon,
  "api_error": AlertTriangle,
  "limited": AlertTriangle,
  "chunk_verification_failed": AlertTriangle,
};

export function EmailVerifierTab({ user }: EmailVerifierTabProps) {
  const [emails, setEmails] = useState("");
  const [fileEmails, setFileEmails] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<VerificationResult[]>([]);
  const [csvBlobUrl, setCsvBlobUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [processedCount, setProcessedCount] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Get the correct API URL based on environment
  const getApiUrl = () => {
    if (typeof window !== 'undefined') {
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      if (isLocalhost) {
        return "/api/verify-emails"; // Local development
      } else {
        return "https://work-scrapper.onrender.com/api/verify-emails"; // Production
      }
    }
    return "https://work-scrapper.onrender.com/api/verify-emails"; // Default
  };

  const extractFirstNameFromEmail = (email: string): string =>
    email.split("@")[0]?.split(".")[0] || "";

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const parsedEmails = text
        .split(/\r?\n|,|;/)
        .map((e) => e.trim().toLowerCase())
        .filter((e) => e.length > 0 && e.includes("@") && e.includes("."));
      setFileEmails(parsedEmails);
      if (parsedEmails.length > 0) {
        setEmails(parsedEmails.join("\n"));
        toast.success(`📁 Loaded ${parsedEmails.length} emails from file`);
      }
    };
    reader.readAsText(file);
  };

  // Enhanced CSV parsing
  const parseCSVToResults = (csvData: string): VerificationResult[] => {
    const lines = csvData.split("\n").filter((line) => line.trim());
    const results: VerificationResult[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      // Handle CSV with quotes and commas properly
      const row = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map((field) => 
        field.trim().replace(/^"|"$/g, "")
      );
      
      if (row.length >= 4) {
        const [email, , status, details] = row;
        let mappedStatus: VerificationResult["status"] = "md";
        if (status === "ok") mappedStatus = "ok";
        else if (status === "ko") mappedStatus = "ko";

        results.push({
          email,
          status: mappedStatus,
          details: details || "unknown",
        });
      }
    }

    console.log("📊 Parsed", results.length, "results from CSV");
    return results;
  };

  // Chunked verification implementation
  const verifyAllEmailsAtOnce = async (emails: string[]): Promise<VerificationResult[]> => {
    try {
      console.log("🔄 Starting chunked verification for", emails.length, "emails");
      
      // Get API URL
      const apiUrl = getApiUrl();
      console.log("🌐 Using API URL:", apiUrl);
      
      // Process in smaller chunks
      const CHUNK_SIZE = 10; // Reduced for better reliability
      const chunks = [];
      
      for (let i = 0; i < emails.length; i += CHUNK_SIZE) {
        chunks.push(emails.slice(i, i + CHUNK_SIZE));
      }

      const allResults: VerificationResult[] = [];
      
      for (let i = 0; i < chunks.length; i++) {
        console.log(`📦 Processing chunk ${i + 1}/${chunks.length}`);
        
        try {
          // Add timeout and better error handling
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

          const response = await fetch(apiUrl, {
            method: "POST",
            headers: { 
              "Content-Type": "application/json",
            },
            body: JSON.stringify(chunks[i]),
            signal: controller.signal
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ Chunk ${i + 1} failed:`, response.status, errorText);
            throw new Error(`HTTP ${response.status}: ${errorText}`);
          }

          const csvData = await response.text();
          
          if (!csvData || csvData.trim().length === 0) {
            throw new Error("Empty response from server");
          }

          const chunkResults = parseCSVToResults(csvData);
          allResults.push(...chunkResults);
          
          // Update progress between chunks
          setProcessedCount(Math.min((i + 1) * CHUNK_SIZE, emails.length));
          setProgress(((i + 1) / chunks.length) * 100);
          
          // Small delay to avoid rate limiting
          if (i < chunks.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        } catch (chunkError) {
          console.error(`❌ Chunk ${i + 1} error:`, chunkError);
          
          // Add fallback results for failed chunk with more specific details
          const errorType = chunkError instanceof Error && chunkError.name === 'AbortError' ? "timeout" : "api_error";
          const chunkResults = chunks[i].map((email) => ({
            email,
            status: "md" as const,
            details: errorType,
          }));
          allResults.push(...chunkResults);
          
          // Show more specific error toast
          const errorMessage = errorType === "timeout" 
            ? `Chunk ${i + 1} timed out (30s)` 
            : `Chunk ${i + 1} API error`;
          
          toast.error(errorMessage);
        }
      }

      console.log("✅ All chunks processed successfully");
      return allResults;
    } catch (error) {
      console.error("💥 Verification error:", error);
      toast.error("Partial verification failure - some emails may not be verified");
      
      // Return fallback results for all emails
      return emails.map((email) => ({
        email,
        status: "md" as const,
        details: "verification_failed",
      }));
    }
  };

  // Enhanced verification with chunked processing
  const verifyEmailsUltraFast = async (emailsToVerify: string[]): Promise<VerificationResult[]> => {
    const totalEmails = emailsToVerify.length;
    
    try {
      console.log("🚀 Starting chunked bulk verification...");
      const allResults = await verifyAllEmailsAtOnce(emailsToVerify);
      
      setProgress(100);
      setProcessedCount(totalEmails);
      return allResults;
    } catch (error) {
      console.error("Chunked verification failed:", error);
      setProgress(100);
      throw error;
    }
  };

  const generateCsv = (results: VerificationResult[]) => {
    const header = "Email,First Name,Status,Details";
    const csvContent = results
      .map((r) => {
        const firstName = extractFirstNameFromEmail(r.email);
        const escapeCsv = (str: string) => `"${str.replace(/"/g, '""')}"`;
        return [
          escapeCsv(r.email),
          escapeCsv(firstName),
          escapeCsv(r.status),
          escapeCsv(r.details)
        ].join(",");
      })
      .join("\n");

    return header + "\n" + csvContent;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailsToVerify =
      fileEmails.length > 0
        ? fileEmails
        : emails
            .split(/\r?\n/)
            .map((e) => e.trim().toLowerCase())
            .filter((e) => e.length > 0 && e.includes("@") && e.includes("."));

    if (emailsToVerify.length === 0) {
      toast.error("Please provide valid email addresses.");
      return;
    }

    if (emailsToVerify.length > 50000) {
      toast.error("Maximum 50,000 emails allowed at once.");
      return;
    }

    setLoading(true);
    setResults([]);
    setCsvBlobUrl(null);
    setProgress(0);
    setProcessedCount(0);

    const startTime = Date.now();

    try {
      console.log("🚀 Starting bulk verification...");
      const allResults = await verifyEmailsUltraFast(emailsToVerify);

      const endTime = Date.now();
      const timeTaken = Math.round((endTime - startTime) / 1000);

      setResults(allResults);

      // Generate CSV for download
      const csvData = generateCsv(allResults);
      const blob = new Blob([csvData], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      setCsvBlobUrl(url);

      // Calculate statistics
      const okCount = allResults.filter((r) => r.status === "ok").length;
      const koCount = allResults.filter((r) => r.status === "ko").length;
      const mdCount = allResults.filter((r) => r.status === "md").length;

      toast.success(
        `🎉 Verified ${allResults.length} emails in ${timeTaken}s! 
        ${okCount} ACCEPT • ${koCount} REJECT • ${mdCount} UNKNOWN`,
        { 
          duration: 6000,
        }
      );

      console.log("🎉 Verification completed successfully");

    } catch (error) {
      console.error("Verification error:", error);
      toast.error("Verification failed. Please check your connection and try again.");
    } finally {
      setLoading(false);
      setProgress(0);
      setProcessedCount(0);
    }
  };

  const handleSaveClick = () => {
    if (!csvBlobUrl) return;
    const a = document.createElement("a");
    a.href = csvBlobUrl;
    a.download = `email-verification-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(csvBlobUrl), 1000);
    toast.success("📥 Results downloaded successfully!");
  };

  // Custom gradient text class with your colors
  const gradientTextClass = "text-4xl font-extrabold mb-3 bg-gradient-to-r from-[#8b39ea] via-[#137fc8] to-[#1d4ed8] bg-clip-text text-transparent select-none";
  const subHeadingClass = "text-lg font-medium bg-gradient-to-r from-[#137fc8] via-[#8b39ea] to-[#1d4ed8] bg-clip-text text-transparent mb-4 px-1";

  // Count results by details for summary
  const detailCounts = results.reduce((acc, result) => {
    const detailKey = result.details;
    acc[detailKey] = (acc[detailKey] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const totalEmails = emails
    .split("\n")
    .filter((e) => e.trim() && e.includes("@") && e.includes(".")).length;

  // Get top details for display
  const topDetails = Object.entries(detailCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);

  // Enhanced status display mapping
  const getStatusDisplay = (detail: string) => {
    const displayMap: { [key: string]: string } = {
      // Valid statuses
      "accept": "Valid Email",
      "valid": "Valid Email",
      "catch_all": "Catch-All Domain",
      "low_risk": "Low Risk",
      
      // Invalid statuses
      "reject": "Invalid Email",
      "invalid": "Invalid Email", 
      "spam_block": "Spam Blocked",
      "spam": "Spam Blocked",
      "disposable": "Disposable Email",
      "high_risk": "High Risk Email",
      "invalid_format": "Invalid Format",
      
      // Unknown/Neutral statuses
      "unknown": "Unknown Status",
      "unverifiable": "Unverifiable",
      "role_account": "Role Account",
      "medium_risk": "Medium Risk",
      "no_catch_all": "No Catch-All",
      
      // Technical errors
      "timeout": "Verification Timeout",
      "network_error": "Network Error",
      "service_error": "Service Error",
      "mx_error": "MX Record Error",
      "no_mx": "No MX Records",
      "smtp_error": "SMTP Error",
      "verification_failed": "Verification Failed",
      "api_error": "API Error",
      "limited": "Rate Limited",
      "chunk_verification_failed": "Partial Failure",
    };
    
    return displayMap[detail] || detail.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  // Get color scheme for different status types
  const getStatusColor = (detail: string) => {
    if (["accept", "valid", "catch_all", "low_risk"].includes(detail)) {
      return { bg: "text-green-600", text: "text-green-700", border: "border-green-200" };
    }
    if (["reject", "invalid", "spam_block", "spam", "disposable", "high_risk", "invalid_format"].includes(detail)) {
      return { bg: "text-red-600", text: "text-red-700", border: "border-red-200" };
    }
    if (["timeout", "network_error", "service_error", "mx_error", "no_mx", "smtp_error", "verification_failed", "api_error", "chunk_verification_failed"].includes(detail)) {
      return { bg: "text-orange-600", text: "text-orange-700", border: "border-orange-200" };
    }
    return { bg: "text-yellow-600", text: "text-yellow-700", border: "border-yellow-200" };
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto p-4">
      {/* Header with enhanced styling */}
      <div className="text-left">
        <div className="flex items-center gap-3 mb-3">
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-[#8b39ea] to-[#137fc8] rounded-lg blur opacity-1"></div>
     
          </div>
          <div>
            <h2 className={gradientTextClass}>Professional Email Verifier</h2>
            <p className={subHeadingClass}>
              Advanced SMTP Validation • Chunked Processing • 50,000 emails limit
            </p>
          </div>
        </div>
      </div>

      {/* Progress Bar with enhanced styling */}
      {loading && (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-[#8b39ea]/20">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-[#137fc8]">
              Verifying {processedCount} of {totalEmails} emails...
            </span>
            <span className="text-sm text-[#1d4ed8] font-bold">{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className="h-3 rounded-full transition-all duration-500 ease-out"
              style={{
                background: `linear-gradient(90deg, ${COLORS.purple}, ${COLORS.lightBlue}, ${COLORS.darkBlue})`,
                width: `${progress}%`
              }}
            ></div>
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>⚡ Chunked Processing</span>
            <span>10 emails per batch</span>
          </div>
        </div>
      )}

      {/* Results Summary */}
      {results.length > 0 && !loading && (
        <div className="bg-white p-6 rounded-lg shadow-xl border border-[#8b39ea]/10">
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-[#8b39ea]" />
            Verification Summary
          </h3>
          <div className="grid grid-cols-3 gap-6 mb-4">
            {topDetails.map(([detail, count], index) => {
              const DetailIcon = detailIcons[detail] || AlertTriangle;
              const colors = getStatusColor(detail);

              return (
                <div 
                  key={detail} 
                  className={`text-center p-4 rounded-lg border-2 ${colors.border} transition-all duration-300 hover:scale-105 hover:shadow-lg`}
                >
                  <div className={`text-4xl font-bold ${colors.bg}`}>
                    {count}
                  </div>
                  <div className="flex items-center justify-center gap-2 mt-2">
                    <DetailIcon className="w-5 h-5" />
                    <div className={`text-lg font-semibold ${colors.text}`}>
                      {getStatusDisplay(detail)}
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 mt-1">Emails</div>
                </div>
              );
            })}
          </div>
          {Object.keys(detailCounts).length > 3 && (
            <div className="text-center text-sm text-gray-500">
              + {Object.keys(detailCounts).length - 3} more status types
            </div>
          )}
        </div>
      )}

      {/* Main Verification Card */}
      <Card className="shadow-2xl border border-[#8b39ea]/20 hover:shadow-3xl transition-all duration-500">
        <CardHeader className="bg-gradient-to-r from-[#8b39ea]/10 via-[#137fc8]/10 to-[#1d4ed8]/10 rounded-t-lg border-b border-[#8b39ea]/20">
          <CardTitle className="flex items-center gap-3">
            <div className="relative">
              <Sparkles className="w-8 h-8 text-[#8b39ea]" />
            </div>
            <span className="bg-gradient-to-r from-[#8b39ea] via-[#137fc8] to-[#1d4ed8] bg-clip-text text-transparent text-2xl font-bold">
              Advanced Email Verification
            </span>
          </CardTitle>
          <CardDescription className="text-lg">
            <span className="bg-gradient-to-r from-[#137fc8] via-[#8b39ea] to-[#1d4ed8] bg-clip-text text-transparent font-semibold">
              Enterprise-Grade Validation • Chunked Processing • Detailed Analytics
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Input */}
            <div className="space-y-3">
              <Label htmlFor="emails" className="text-base font-semibold text-[#1d4ed8]">
                Email Addresses (one per line, max 50,000)
              </Label>
              <Textarea
                id="emails"
                placeholder={"example@gmail.com\ntest@company.com\nuser@domain.org"}
                value={emails}
                onChange={(e) => setEmails(e.target.value)}
                disabled={loading}
                rows={8}
                className="font-mono text-sm border-2 border-[#137fc8]/30 rounded-lg p-4 focus:ring-2 focus:ring-[#8b39ea] focus:border-[#8b39ea] resize-none transition-all duration-300 hover:border-[#8b39ea]/50"
              />
              <div className="flex justify-between text-sm">
                <span className="text-[#137fc8] font-medium">
                  {totalEmails} emails ready for verification (Max: 50,000)
                </span>
                <span className="font-semibold">
                  <span className="text-green-600">ACCEPT</span> /{" "}
                  <span className="text-yellow-600"> UNKNOWN</span> /{" "}
                  <span className="text-red-600"> REJECT</span>
                </span>
              </div>
            </div>

            {/* File Upload */}
            <div className="space-y-3">
              <Label htmlFor="fileInput" className="text-base font-semibold text-[#1d4ed8]">
                Or upload a CSV/TXT file with emails
              </Label>
              <input
                type="file"
                id="fileInput"
                accept=".csv,.txt,text/csv,text/plain"
                onChange={handleFileUpload}
                disabled={loading}
                className="block w-full text-sm text-gray-500 transition-all duration-300 file:mr-4 file:py-3 file:px-6 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gradient-to-r file:from-[#8b39ea] file:to-[#137fc8] file:text-white file:transition-all file:duration-300 hover:file:bg-gradient-to-r hover:file:from-[#8b39ea] hover:file:to-[#1d4ed8] hover:file:scale-105"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2 border-[#8b39ea] text-[#8b39ea] hover:bg-[#8b39ea] hover:text-white transition-all duration-300"
                onClick={() => {
                  setFileEmails([]);
                  setEmails("");
                  const fileInput = document.getElementById("fileInput") as HTMLInputElement;
                  if (fileInput) fileInput.value = "";
                }}
                disabled={loading}
              >
                Clear All
              </Button>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading || totalEmails === 0}
              className="w-full bg-gradient-to-r from-[#8b39ea] via-[#137fc8] to-[#1d4ed8] hover:from-[#8b39ea] hover:via-[#1d4ed8] hover:to-[#137fc8] text-white font-bold shadow-2xl transition-all duration-500 text-lg py-6 h-auto transform hover:scale-105"
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                  <div className="text-left">
                    <div className="font-semibold">
                      Processing {processedCount}/{totalEmails} emails...
                    </div>
                    <div className="text-sm font-normal opacity-90">
                      Chunked processing (10 per batch)
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <Rocket className={`mr-3 h-6 w-6 transition-transform duration-300 ${isHovered ? 'animate-bounce' : ''}`} />
                  <div className="text-left">
                    <div className="font-semibold">Start Email Verification</div>
                    <div className="text-sm font-normal opacity-90">
                      Verify up to 50,000 emails with advanced processing
                    </div>
                  </div>
                </>
              )}
            </Button>
          </form>

          {/* Results Display */}
          {results.length > 0 && (
            <div className="mt-8 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-xl text-gray-800 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#8b39ea]" />
                  Detailed Verification Results
                </h3>
                <div className="text-sm text-[#137fc8] bg-[#137fc8]/10 px-3 py-1 rounded-full font-medium">
                  {results.length} emails processed
                </div>
              </div>
              <div className="max-h-96 overflow-y-auto border border-[#8b39ea]/20 rounded-lg p-4 space-y-3 bg-gradient-to-br from-white to-[#8b39ea]/5">
                {results.slice(-50).map(({ email, status, details }, index) => {
                  const { bg, color, badge } = statusPresets[status];
                  const DetailIcon = detailIcons[details] || AlertTriangle;
                  const displayText = getStatusDisplay(details);

                  return (
                    <div
                      key={email}
                      className={`flex items-center justify-between p-4 rounded-xl transition-all duration-300 ${bg} border-2 border-[#8b39ea]/10 shadow-sm hover:shadow-lg hover:scale-105`}
                    >
                      <div className="flex items-center gap-4 min-w-0 flex-1">
                        <DetailIcon className={`w-5 h-5 flex-shrink-0 ${color}`} />
                        <div className="min-w-0 flex-1">
                          <div className={`font-semibold text-sm truncate ${color}`}>
                            {email}
                          </div>
                          <div className="text-xs opacity-90 truncate text-gray-800 font-medium">
                            {displayText}
                          </div>
                        </div>
                      </div>
                      <div
                        className={`text-xs font-bold px-3 py-2 rounded-full ${badge} ${color} flex-shrink-0 ml-3 border-2 font-mono transition-all duration-300 hover:scale-110`}
                      >
                        {status.toUpperCase()}
                      </div>
                    </div>
                  );
                })}
                {results.length > 50 && (
                  <div className="text-center text-sm text-[#137fc8] py-3 bg-white rounded-lg border border-[#8b39ea]/20">
                    Showing last 50 of {results.length} results
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Download Button */}
          {csvBlobUrl && !loading && (
            <Button
              className="mt-6 w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold shadow-2xl transition-all duration-300 py-6 text-lg transform hover:scale-105"
              onClick={handleSaveClick}
            >
              <Download className="mr-3 h-6 w-6" />
              <div className="text-left">
                <div className="font-semibold">Download Complete Results</div>
                <div className="text-sm font-normal opacity-90">
                  {results.length} emails with detailed verification status
                </div>
              </div>
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}