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
  Zap,
  Rocket,
  Download,
  Shield,
  MailCheck,
  Ban,
  Clock,
  Server,
  Mail,
  ShieldCheck,
} from "lucide-react";

interface User {
  id: string;
  email?: string;
  name?: string;
  // Extend with other user properties as needed
}

interface VerificationResult {
  email: string;
  status: "ok" | "md" | "ko";
  details: string;
}

interface EmailVerifierTabProps {
  user: User;
}

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

const detailIcons: { [key: string]: any } = {
  accept: CheckCircle2,
  reject: XCircleIcon,
  "spam block": Shield,
  "catch all": MailCheck,
  "no catch": MailCheck,
  disposable: Ban,
  "role account": AlertTriangle,
  "high risk": XCircleIcon,
  "medium risk": AlertTriangle,
  "low risk": CheckCircle2,
  unknown: AlertTriangle,
  timeout: Clock,
  limited: AlertTriangle,
  "no mx": Server,
  "mx error": Server,
  unverifiable: AlertTriangle,
  verification_failed: XCircleIcon,
};

export function EmailVerifierTab({ user }: EmailVerifierTabProps) {
  const [emails, setEmails] = useState("");
  const [fileEmails, setFileEmails] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<VerificationResult[]>([]);
  const [csvBlobUrl, setCsvBlobUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

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
      }
    };
    reader.readAsText(file);
  };

  const verifyAllEmailsAtOnce = async (
    emails: string[]
  ): Promise<VerificationResult[]> => {
    try {
      const response = await fetch("/api/verify-emails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(emails),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Verification failed: ${response.status} - ${errorData}`);
      }

      const csvData = await response.text();
      return parseCSVToResults(csvData);
    } catch (error) {
      console.error("Verification error:", error);
      return emails.map((email) => ({
        email,
        status: "md" as const,
        details: "verification_failed",
      }));
    }
  };

  const parseCSVToResults = (csvData: string): VerificationResult[] => {
    const lines = csvData.split("\n").filter((line) => line.trim());
    const results: VerificationResult[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      const row = line.split(",").map((field) => field.trim().replace(/^"|"$/g, ""));
      if (row.length >= 4) {
        const [email, , status, details] = row;
        let mappedStatus: VerificationResult["status"] = "md";
        if (status === "ok") mappedStatus = "ok";
        else if (status === "ko") mappedStatus = "ko";

        let cleanDetails = details.toLowerCase();
        if (cleanDetails.includes("api_error") || cleanDetails.includes("network_error")) {
          cleanDetails = "timeout";
        } else if (cleanDetails.includes("reject")) {
          cleanDetails = "reject";
        } else if (cleanDetails.includes("accept")) {
          cleanDetails = "accept";
        }

        results.push({
          email,
          status: mappedStatus,
          details: cleanDetails || "unknown",
        });
      }
    }

    return results;
  };

  const verifyEmailsUltraFast = async (
    emailsToVerify: string[]
  ): Promise<VerificationResult[]> => {
    const totalEmails = emailsToVerify.length;

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 85) return 85;
        return prev + 100 / (totalEmails / 5);
      });
    }, 50);

    try {
      const allResults = await verifyAllEmailsAtOnce(emailsToVerify);
      clearInterval(progressInterval);
      setProgress(100);
      return allResults;
    } catch (error) {
      clearInterval(progressInterval);
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
        return [escapeCsv(r.email), escapeCsv(firstName), escapeCsv(r.status), escapeCsv(r.details)].join(",");
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

    if (emailsToVerify.length > 1000) {
      toast.error("Maximum 1000 emails allowed at once.");
      return;
    }

    setLoading(true);
    setResults([]);
    setCsvBlobUrl(null);
    setProgress(0);

    const startTime = Date.now();

    try {
      const allResults = await verifyEmailsUltraFast(emailsToVerify);

      const endTime = Date.now();
      const timeTaken = Math.round((endTime - startTime) / 1000);

      setResults(allResults);

      const csvData = generateCsv(allResults);
      const blob = new Blob([csvData], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      setCsvBlobUrl(url);

      const okCount = allResults.filter((r) => r.status === "ok").length;
      const koCount = allResults.filter((r) => r.status === "ko").length;
      const mdCount = allResults.filter((r) => r.status === "md").length;

      toast.success(
        `✅ Verified ${allResults.length} emails in ${timeTaken}s! ${okCount} ACCEPT • ${koCount} REJECT • ${mdCount} UNKNOWN`,
        { duration: 5000 }
      );
    } catch (error) {
      console.error("Verification error:", error);
      toast.error("Verification failed. Please try again.");
    } finally {
      setLoading(false);
      setProgress(0);
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
  };

  const gradientTextClass =
    "text-4xl font-extrabold mb-3 bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-500 bg-clip-text text-transparent select-none shadow-lg drop-shadow";
  const subHeadingClass =
    "text-lg font-medium bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent mb-4 px-1";

  const detailCounts = results.reduce((acc, result) => {
    const detailKey = result.details;
    acc[detailKey] = (acc[detailKey] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const totalEmails = emails
    .split("\n")
    .filter((e) => e.trim() && e.includes("@") && e.includes(".")).length;

  const topDetails = Object.entries(detailCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);

  return (
    <div className="space-y-8 max-w-4xl mx-auto p-4">
      <div className="text-center">
        <div className="flex items-center justify-center gap-3 mb-3">
          <ShieldCheck className="w-12 h-12 text-purple-600" />
          <h2 className={gradientTextClass}>Ninja Email Verifier</h2>
        </div>
        <p className={subHeadingClass}>
          Real-time SMTP verification • Bulk email checking • Instant results
        </p>
      </div>

      {loading && (
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-blue-700">
              Turbo Processing {totalEmails} emails...
            </span>
            <span className="text-sm text-gray-600">{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Ninja Mode</span>
            <span>SMTP Verification</span>
          </div>
        </div>
      )}

      {results.length > 0 && !loading && (
        <div className="bg-white p-6 rounded-lg shadow-lg border grid grid-cols-3 gap-6">
          {topDetails.map(([detail, count], index) => {
            const DetailIcon = detailIcons[detail] || AlertTriangle;
            const colors = [
              { bg: "text-green-600", text: "text-green-700" },
              { bg: "text-yellow-600", text: "text-yellow-700" },
              { bg: "text-red-600", text: "text-red-700" },
            ];

            return (
              <div key={detail} className="text-center">
                <div
                  className={`text-4xl font-bold ${
                    colors[index]?.bg || colors[0].bg
                  }`}
                >
                  {count}
                </div>
                <div className="flex items-center justify-center gap-2">
                  <DetailIcon className="w-4 h-4" />
                  <div
                    className={`text-lg font-semibold ${
                      colors[index]?.text || colors[0].text
                    } capitalize`}
                  >
                    {detail.replace(/_/g, " ")}
                  </div>
                </div>
                <div className="text-sm text-gray-600 mt-1">Emails</div>
              </div>
            );
          })}
        </div>
      )}

      <Card className="shadow-xl border-gray-200 hover:shadow-2xl transition-shadow duration-300">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-t-lg">
          <CardTitle className="flex items-center gap-3">
            <Mail className="w-8 h-8 text-purple-600" />
            <span className="bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 bg-clip-text text-transparent text-2xl">
              Ninja Email Verification
            </span>
          </CardTitle>
          <CardDescription className="text-lg">
            <span className="bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 bg-clip-text text-transparent font-semibold">
              SMTP Verification • Bulk Processing • Detailed Analytics
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="emails" className="text-base font-semibold">
                Email Addresses (one per line, max 1000)
              </Label>
              <Textarea
                id="emails"
                placeholder={"john@example.com\njane@example.com\ncontact@company.com"}
                value={emails}
                onChange={(e) => setEmails(e.target.value)}
                disabled={loading}
                rows={8}
                className="font-mono text-sm border-2 border-gray-300 rounded-lg p-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              />
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">
                  {totalEmails} emails ready for verification
                </span>
                <span className="font-semibold">
                  <span className="text-green-600">ACCEPT</span> /{" "}
                  <span className="text-yellow-600"> UNKNOWN</span> /{" "}
                  <span className="text-red-600"> REJECT</span>
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <Label htmlFor="fileInput" className="text-base font-semibold">
                Or upload a CSV/TXT file with emails
              </Label>
              <input
                type="file"
                id="fileInput"
                accept=".csv,.txt,text/csv,text/plain"
                onChange={handleFileUpload}
                disabled={loading}
                className="block w-full text-sm text-gray-500
                file:mr-4 file:py-3 file:px-6
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-gradient-to-r file:from-blue-500 file:to-purple-600
                file:text-white
                hover:file:bg-gradient-to-r hover:file:from-blue-600 hover:file:to-purple-700"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => {
                  setFileEmails([]);
                  setEmails("");
                  const fileInput = document.getElementById(
                    "fileInput"
                  ) as HTMLInputElement;
                  if (fileInput) fileInput.value = "";
                }}
                disabled={loading}
              >
                Clear All
              </Button>
            </div>

            <Button
              type="submit"
              disabled={loading || totalEmails === 0}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold shadow-2xl transition-all duration-200 text-lg py-6 h-auto"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                  <div className="text-left">
                    <div className="font-semibold">
                      Processing {totalEmails} emails...
                    </div>
                    <div className="text-sm font-normal opacity-90">
                      SMTP verification in progress
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <ShieldCheck className="mr-3 h-6 w-6" />
                  <div className="text-left">
                    <div className="font-semibold">Start Verification</div>
                    <div className="text-sm font-normal opacity-90">
                      Verify email validity with SMTP checks
                    </div>
                  </div>
                </>
              )}
            </Button>
          </form>

          {results.length > 0 && (
            <div className="mt-8 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-xl text-gray-800">
                  Verification Results
                </h3>
                <div className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                  {results.length} emails processed
                </div>
              </div>
              <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg p-4 space-y-3 bg-gray-50">
                {results.slice(-50).map(({ email, status, details }) => {
                  const { bg, color, badge } = statusPresets[status];
                  const DetailIcon = detailIcons[details] || AlertTriangle;

                  const displayText = details.toUpperCase();

                  return (
                    <div
                      key={email}
                      className={`flex items-center justify-between p-4 rounded-xl transition-all duration-200 ${bg} border-2 shadow-sm hover:shadow-md`}
                    >
                      <div className="flex items-center gap-4 min-w-0 flex-1">
                        <DetailIcon className={`w-5 h-5 flex-shrink-0 ${color}`} />
                        <div className="min-w-0 flex-1">
                          <div className={`font-semibold text-sm truncate ${color}`}>
                            {email}
                          </div>
                          <div className="text-xs opacity-90 truncate text-gray-800 font-medium capitalize">
                            {details.replace(/_/g, " ")}
                          </div>
                        </div>
                      </div>
                      <div
                        className={`text-sm font-bold px-3 py-2 rounded-full ${badge} ${color} flex-shrink-0 ml-3 border-2 font-mono`}
                      >
                        {displayText}
                      </div>
                    </div>
                  );
                })}
                {results.length > 50 && (
                  <div className="text-center text-sm text-gray-500 py-3 bg-white rounded-lg border">
                    Showing last 50 of {results.length} results
                  </div>
                )}
              </div>
            </div>
          )}

          {csvBlobUrl && !loading && (
            <Button
              className="mt-6 w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold shadow-2xl transition-all duration-200 py-6 text-lg"
              onClick={handleSaveClick}
            >
              <Download className="mr-3 h-6 w-6" />
              <div className="text-left">
                <div className="font-semibold">Download CSV Results</div>
                <div className="text-sm font-normal opacity-90">
                  {results.length} emails verified with detailed status
                </div>
              </div>
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
