import { NextRequest } from "next/server";

const TOKEN_URL = "https://token.mailtester.ninja/token?key=";
const VERIFY_URL_BASE = "https://happy.mailtester.ninja/ninja";

interface VerificationResult {
  email: string;
  firstName: string;
  status: "ok" | "ko" | "md";
  details: string;
  timestamp: number;
}

interface NinjaVerifierResponse {
  code?: string;
  message?: string;
  valid?: boolean;
  is_valid?: boolean;
  status?: string;
  result?: string;
  error?: string;
}

// Cache token for 24 hours
let cachedToken: { token: string; expiry: number } | null = null;

async function getToken(): Promise<string> {
  const apiKey = process.env.NINJA_EMAIL_VERIFIER_API_KEY;
  if (!apiKey) {
    throw new Error("NINJA_EMAIL_VERIFIER_API_KEY is not configured");
  }

  // Return cached token if valid
  if (cachedToken && Date.now() < cachedToken.expiry) {
    return cachedToken.token;
  }

  try {
    const tokenResponse = await fetch(`${TOKEN_URL}${apiKey}`);
    if (!tokenResponse.ok) {
      throw new Error(`Token fetch failed: ${tokenResponse.status}`);
    }

    const tokenData = await tokenResponse.json();
    
    if (!tokenData.token) {
      throw new Error("No token received from API");
    }

    // Cache token for 23 hours (with 1 hour buffer)
    cachedToken = {
      token: tokenData.token,
      expiry: Date.now() + 23 * 60 * 60 * 1000
    };

    return tokenData.token;
  } catch (error) {
    console.error("Token acquisition error:", error);
    throw new Error(`Failed to get verification token: ${error}`);
  }
}

// High-performance batch processing
async function processEmailsConcurrently(emails: string[], token: string): Promise<VerificationResult[]> {
  const CONCURRENT_REQUESTS = 10; // Reduced for better stability
  const results: VerificationResult[] = [];
  
  // Process in concurrent groups
  for (let i = 0; i < emails.length; i += CONCURRENT_REQUESTS) {
    const batch = emails.slice(i, i + CONCURRENT_REQUESTS);
    
    const batchPromises = batch.map(email => 
      verifySingleEmailWithRetry(email, token, 2) // 2 retries
    );

    try {
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      // Small delay between batches to respect rate limits
      if (i + CONCURRENT_REQUESTS < emails.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    } catch (error) {
      console.error(`Batch ${i} failed:`, error);
      // If batch fails, add failed results and continue
      const failedResults = batch.map(email => createFailedResult(email));
      results.push(...failedResults);
    }
  }

  return results;
}

// Robust email verification with retry logic
async function verifySingleEmailWithRetry(
  email: string, 
  token: string, 
  maxRetries: number = 2
): Promise<VerificationResult> {
  const firstName = extractFirstNameFromEmail(email);
  
  if (!isValidEmail(email)) {
    return createResult(email, firstName, "ko", "invalid_format");
  }

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const url = `${VERIFY_URL_BASE}?email=${encodeURIComponent(email)}&token=${token}`;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'NinjaEmailVerifier/2.0',
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data: NinjaVerifierResponse = await response.json();
      
      // Map Ninja Verifier response to our status
      return mapNinjaResponseToResult(email, firstName, data);

    } catch (error) {
      console.warn(`Attempt ${attempt} failed for ${email}:`, error);
      
      if (attempt === maxRetries) {
        return createResult(email, firstName, "md", 
          error instanceof Error && error.name === 'AbortError' ? "timeout" : "api_error"
        );
      }
      
      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, attempt * 500));
    }
  }

  return createResult(email, firstName, "md", "max_retries_exceeded");
}

// Map Ninja Verifier API response to our format
function mapNinjaResponseToResult(
  email: string, 
  firstName: string, 
  data: NinjaVerifierResponse
): VerificationResult {
  // Handle different response formats from Ninja API
  if (data.code === "ok" || data.valid === true || data.is_valid === true) {
    return createResult(email, firstName, "ok", 
      data.message?.toLowerCase().replace(/\s+/g, '_') || "valid"
    );
  }
  
  if (data.code === "ko" || data.valid === false || data.is_valid === false) {
    return createResult(email, firstName, "ko", 
      data.message?.toLowerCase().replace(/\s+/g, '_') || "invalid"
    );
  }
  
  if (data.error) {
    return createResult(email, firstName, "md", "api_error");
  }
  
  // Handle unknown responses
  return createResult(email, firstName, "md", 
    data.message?.toLowerCase().replace(/\s+/g, '_') || "unknown_response"
  );
}

function createResult(email: string, firstName: string, status: "ok" | "ko" | "md", details: string): VerificationResult {
  return {
    email,
    firstName,
    status,
    details,
    timestamp: Date.now()
  };
}

function createFailedResult(email: string): VerificationResult {
  return {
    email,
    firstName: extractFirstNameFromEmail(email),
    status: "md",
    details: "verification_failed",
    timestamp: Date.now()
  };
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function extractFirstNameFromEmail(email: string): string {
  return email.split("@")[0]?.split('.')[0]?.split('_')[0] || "unknown";
}

function arrayToCSV(data: VerificationResult[]): string {
  if (!data?.length) return "email,firstName,status,details,timestamp";
  
  const headers = ['email', 'firstName', 'status', 'details', 'timestamp'];
  const csvRows = [
    headers.join(","),
    ...data.map(row =>
      headers
        .map(header => {
          const val = row[header as keyof VerificationResult];
          if (typeof val === "string" && (val.includes(",") || val.includes("\n") || val.includes('"'))) {
            return `"${val.replace(/"/g, '""')}"`;
          }
          return val ?? "";
        })
        .join(",")
    ),
  ];
  return csvRows.join("\n");
}

export async function POST(request: NextRequest) {
  try {
    const emails: string[] = await request.json();

    // Validate input
    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return new Response(JSON.stringify({ 
        success: false,
        message: "No emails provided" 
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Validate and deduplicate emails
    const validEmails = emails
      .filter(email => typeof email === 'string' && email.trim().length > 0)
      .map(email => email.trim().toLowerCase())
      .filter(email => isValidEmail(email))
      .filter((email, index, self) => self.indexOf(email) === index);

    if (validEmails.length === 0) {
      return new Response(JSON.stringify({ 
        success: false,
        message: "No valid emails provided" 
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Limit for performance
    if (validEmails.length > 100) {
      return new Response(JSON.stringify({ 
        success: false,
        message: "Maximum 100 emails allowed per request",
        maxAllowed: 100 
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get authentication token
    const token = await getToken();

    // Process emails with high concurrency
    const results = await processEmailsConcurrently(validEmails, token);
    
    const csvString = arrayToCSV(results);

    return new Response(csvString, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": "attachment; filename=verified_emails.csv",
        "X-Processed-Count": results.length.toString(),
        "X-Valid-Count": results.filter(r => r.status === "ok").length.toString(),
      },
    });

  } catch (error: any) {
    console.error("Verification error:", error);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        message: error.message || "Internal server error",
        error: error.toString()
      }), { 
        status: 500, 
        headers: { "Content-Type": "application/json" } 
      }
    );
  }
}