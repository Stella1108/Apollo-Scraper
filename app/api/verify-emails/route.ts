import { NextRequest } from "next/server";

const TOKEN_URL = "https://token.mailtester.ninja/token?key=";
const VERIFY_URL_BASE = "https://happy.mailtester.ninja/ninja";

interface VerificationResult {
  email: string;
  firstName: string;
  status: string;
  details?: string;
  [key: string]: any;
}

function arrayToCSV(data: VerificationResult[]): string {
  if (!data?.length) return "email,firstName,status,details";
  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(","),
    ...data.map((row) =>
      headers
        .map((h) => {
          const val = row[h];
          if (typeof val === "string" && (val.includes(",") || val.includes("\n"))) {
            return `"${val.replace(/"/g, '""')}"`;
          }
          return val ?? "";
        })
        .join(",")
    ),
  ];
  return csvRows.join("\n");
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function extractFirstNameFromEmail(email: string): string {
  return email.split("@")[0] || "";
}

async function verifyEmail(email: string, token: string): Promise<VerificationResult> {
  const firstName = extractFirstNameFromEmail(email);
  if (!isValidEmail(email)) {
    return { email, firstName, status: "invalid_format", details: "Email format invalid" };
  }

  const url = `${VERIFY_URL_BASE}?email=${encodeURIComponent(email)}&token=${token}`;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      const errText = await res.text();
      return { email, firstName, status: "error", details: errText };
    }
    const data = await res.json();
    return { email, firstName, ...data };
  } catch (error) {
    return { email, firstName, status: "error", details: String(error) };
  }
}

// Batched verification with batch size 20
async function verifyEmailsInBatches(
  emails: string[],
  token: string,
  batchSize = 20
): Promise<VerificationResult[]> {
  const results: VerificationResult[] = [];
  for (let i = 0; i < emails.length; i += batchSize) {
    const batch = emails.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(email => verifyEmail(email, token)));
    results.push(...batchResults);
  }
  return results;
}

export async function POST(request: NextRequest) {
  try {
    const emails: string[] = await request.json();

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return new Response(JSON.stringify({ message: "No emails provided" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const apiKey = process.env.NINJA_EMAIL_VERIFIER_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ message: "Server error: missing API key" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const tokenResponse = await fetch(`${TOKEN_URL}${apiKey}`);
    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      return new Response(
        JSON.stringify({ message: "Failed to get token", details: errorText }),
        { status: tokenResponse.status, headers: { "Content-Type": "application/json" } }
      );
    }

    const tokenJson = await tokenResponse.json();
    const token = tokenJson.token;
    if (!token) {
      return new Response(
        JSON.stringify({ message: "Token not received from NinjaVerifier" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Use batch size 20 to verify emails
    const results = await verifyEmailsInBatches(emails, token, 20);

    const csvString = arrayToCSV(results);

    return new Response(csvString, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": "attachment; filename=verified_emails.csv",
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ message: "Internal server error", error: String(error) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
