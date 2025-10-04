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
import { CircleCheck as CheckCircle2, Loader as Loader2, Mail } from "lucide-react";

export function EmailVerifierTab() {
  const [emails, setEmails] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 2000));
      toast.success("Email verification started!");
      setEmails("");
    } catch (error) {
      toast.error("Failed to start verification");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-700 ease-out max-w-9xl mx-auto p-4">
      <div>
        <h2
          className="text-3xl md:text-4xl font-extrabold mb-3 bg-gradient-to-r from-blue-500 via-pink-500 to-indigo-600 bg-clip-text text-transparent animate-gradient-x"
          style={{ backgroundSize: "200% 200%" }}
        >
          Email Verifier
        </h2>
        <p className="text-slate-600 text-lg max-w-lg">
          Verify email addresses to improve deliverability and increase campaign success.
        </p>
      </div>

      <Card className="shadow-lg border-gray-200 hover:shadow-2xl transition-shadow duration-300">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-700">
            <Mail className="w-6 h-6" />
            Bulk Email Verification
          </CardTitle>
          <CardDescription>
            Enter email addresses (one per line) to verify their validity
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="emails">Email Addresses</Label>
              <Textarea
                id="emails"
                placeholder={`john@example.com\njane@example.com\ncontact@company.com`}
                value={emails}
                onChange={(e) => setEmails(e.target.value)}
                required
                rows={10}
                className="font-mono text-sm transition-all duration-300 focus:ring-2 focus:ring-blue-500 rounded-md border border-gray-300 p-3 focus:border-blue-500 resize-none"
              />
              <p className="text-xs text-slate-500">
                {emails.split("\n").filter((e) => e.trim()).length} emails entered
              </p>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold shadow-lg transition-transform hover:scale-[1.03] active:scale-[0.97]"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-5 w-5" />
                  Verify Emails
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <style jsx>{`
        @keyframes gradient-x {
          0%,
          100% {
            background-position: 0% center;
          }
          50% {
            background-position: 100% center;
          }
        }
        .animate-gradient-x {
          animation: gradient-x 4s ease infinite;
        }
      `}</style>
    </div>
  );
}
