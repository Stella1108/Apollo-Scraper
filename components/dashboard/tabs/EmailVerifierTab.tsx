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
  Mail,
  XCircle as XCircleIcon,
  AlertTriangle,
} from "lucide-react";
import { motion } from "framer-motion";

interface VerificationResult {
  email: string;
  status: string;   // accepted, rejected, spam block, error, etc.
  details?: string; // filtered keyword labels or error reasons
}

interface EmailVerifierTabProps {
  user?: any;
}

const statusPresets: Record<
  string,
  { bg: string; color: string; icon: React.FC<any>; badge: string }
> = {
  accepted: {
    bg: "bg-green-100 border-green-400",
    color: "text-green-800",
    icon: CheckCircle2,
    badge: "border-green-500",
  },
  rejected: {
    bg: "bg-red-100 border-red-400",
    color: "text-red-800",
    icon: XCircleIcon,
    badge: "border-red-500",
  },
  "spam block": {
    bg: "bg-red-200 border-red-600",
    color: "text-red-900",
    icon: XCircleIcon,
    badge: "border-red-600",
  },
  pending: {
    bg: "bg-blue-100 border-blue-400",
    color: "text-blue-800",
    icon: Loader2,
    badge: "border-blue-500",
  },
  error: {
    bg: "bg-yellow-100 border-yellow-400",
    color: "text-yellow-800",
    icon: AlertTriangle,
    badge: "border-yellow-500",
  },
};

function labelFromDetails(details: string): string {
  if (!details) return "";
  const lowered = details.toLowerCase();
  if (lowered.includes("accepted")) return "Accepted";
  if (lowered.includes("rejected")) return "Rejected";
  if (lowered.includes("spam block")) return "Spam Block";
  if (lowered.includes("pending")) return "Pending";
  if (lowered.includes("error")) return "Error";
  return details.split(/[:\-,]/)[0].trim();
}

function extractFirstNameFromEmail(email: string): string {
  return email.split("@")[0] || "";
}

export function EmailVerifierTab({ user }: EmailVerifierTabProps) {
  const [emails, setEmails] = useState("");
  const [fileEmails, setFileEmails] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<VerificationResult[]>([]);
  const [csvBlobUrl, setCsvBlobUrl] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      const parsedEmails = text
        .split(/\r?\n|,/)
        .map((item) => item.trim())
        .filter((item) => item.length > 0);
      setFileEmails(parsedEmails);
    };
    reader.readAsText(file);
  };

  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const verifyEmailsInBatch = async (emails: string[], batchSize = 5) => {
    let allResults: VerificationResult[] = [];

    for (let i = 0; i < emails.length; i += batchSize) {
      const batch = emails.slice(i, i + batchSize);
      try {
        const response = await fetch("/api/verify-emails", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(batch),
        });
        if (!response.ok) throw new Error("API batch request failed");
        const dataText = await response.text();
        const lines = dataText.trim().split("\n");

        let returnedEmails = new Set<string>();
        for (let j = 1; j < lines.length; j++) {
          const cols = lines[j].split(",");
          if (cols.length >= 4) {
            const email = cols[0];
            const statusRaw = cols[2].toLowerCase();
            const rawDetails = cols.slice(3).join(",").replace(/^"|"$/g, "");
            const details = labelFromDetails(rawDetails);
            allResults.push({ email, status: statusRaw, details });
            returnedEmails.add(email);
          }
        }

        batch.forEach((email) => {
          if (!returnedEmails.has(email)) {
            allResults.push({ email, status: "error", details: "No response from API" });
          }
        });
      } catch (error) {
        batch.forEach((email) => {
          allResults.push({ email, status: "error", details: "Batch API request failed" });
        });
      }
      await delay(200);
    }
    return allResults;
  };

  const generateCsv = (results: VerificationResult[]) => {
    const header = "email,firstName,status,details";
    return (
      header +
      "\n" +
      results
        .map((r) => {
          const firstName = extractFirstNameFromEmail(r.email);
          const safeDetails = `"${r.details || ""}"`;
          return `${r.email},${firstName},${r.status},${safeDetails}`;
        })
        .join("\n")
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailsToVerify =
      fileEmails.length > 0
        ? fileEmails
        : emails
            .split(/\r?\n/)
            .map((e) => e.trim())
            .filter((e) => e);

    if (emailsToVerify.length === 0) {
      toast.error("Please provide at least one email via textarea or file upload.");
      return;
    }

    setLoading(true);
    setResults([]);
    setCsvBlobUrl(null);

    const allResults = await verifyEmailsInBatch(emailsToVerify, 5);
    setResults(allResults);

    const csvData = generateCsv(allResults);
    const blob = new Blob([csvData], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    setCsvBlobUrl(url);

    setLoading(false);
    toast.success("Email verification completed! Click Save to download CSV.");

    setEmails("");
    setFileEmails([]);
    (document.getElementById("fileInput") as HTMLInputElement).value = "";
  };

  const handleSaveClick = () => {
    if (!csvBlobUrl) return;
    const a = document.createElement("a");
    a.href = csvBlobUrl;
    a.download = "email-verification-results.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(csvBlobUrl), 1000);
    setCsvBlobUrl(null);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: -30 }} 
      animate={{ opacity: 1, x: 0 }} 
      transition={{ duration: 0.5 }} 
      className="space-y-8 max-w-3xl mx-0 p-4 text-left"
      style={{ marginLeft: 0 }}
    >
      <h2 className="text-4xl font-extrabold mb-3 bg-gradient-to-r from-blue-600 via-purple-700 to-indigo-700 bg-clip-text text-transparent select-none">
        Email Verifier
      </h2>
      <p className="text-lg font-medium text-gray-800 mb-4 px-1">
        Verify email addresses with key details only.
      </p>
      <Card className="shadow-xl border-gray-200 hover:shadow-2xl transition-shadow duration-300 bg-gradient-to-br from-white via-slate-100 to-zinc-50 width full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-700">
            <Mail className="w-6 h-6" />
            Bulk Email Verification
          </CardTitle>
          <CardDescription>
            Enter emails (one per line) or upload a CSV file to verify.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="emails" className="text-gray-700 font-semibold">Email Addresses (one per line)</Label>
              <Textarea
                id="emails"
                placeholder="john@example.com&#10;jane@example.com&#10;contact@company.com"
                value={emails}
                onChange={(e) => setEmails(e.target.value)}
                disabled={fileEmails.length > 0 || loading}
                rows={10}
                className="font-mono text-sm border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-blue-500 resize-none text-gray-900"
              />
              <p className="text-xs text-gray-500">
                {emails.split("\n").filter((e) => e.trim()).length} emails entered
              </p>
            </div>
            <div>
              <Label htmlFor="fileInput" className="text-gray-700 font-semibold">Or upload a CSV file with emails</Label>
              <input
                type="file"
                id="fileInput"
                accept=".csv,text/csv"
                onChange={handleFileUpload}
                disabled={loading}
                className="mt-1"
              />
              {fileEmails.length > 0 && (
                <p className="text-xs text-gray-500">{fileEmails.length} emails loaded from file</p>
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => {
                  setFileEmails([]);
                  (document.getElementById("fileInput") as HTMLInputElement).value = "";
                }}
                disabled={loading}
              >
                Clear File
              </Button>
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold shadow-lg"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Verifying emails...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-5 w-5" />
                  Verify Emails
                </>
              )}
            </Button>
          </form>
          {results.length > 0 && (
            <div className="mt-6 max-h-96 overflow-y-auto border border-gray-100 rounded-md p-4 space-y-3 bg-white shadow-inner">
              {results.map(({ email, status, details }) => {
                const preset = statusPresets[status] || statusPresets.error;
                return (
                  <div
                    key={email}
                    className={`flex flex-col p-3 rounded-xl border ${preset.bg} ${preset.badge} shadow hover:scale-105 transition-transform`}
                  >
                    <div className={`flex items-center gap-2 font-mono font-bold text-base ${preset.color}`}>
                      <preset.icon className="w-6 h-6 drop-shadow-lg" />
                      <span>{email}</span>
                      <span className="ml-auto">{details}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {csvBlobUrl && !loading && (
            <Button
              className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold shadow"
              onClick={handleSaveClick}
            >
              Save CSV
            </Button>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
