import { NextRequest } from "next/server";

const TOKEN_URL = "https://token.mailtester.ninja/token?key=";
const VERIFY_URL_BASE = "https://happy.mailtester.ninja/ninja";

interface VerificationResult {
  email: string;
  firstName: string;
  status: string;
  details: string;
}

interface NinjaVerifierResponse {
  email?: string;
  user?: string;
  domain?: string;
  mx?: string;
  code?: string; // This is the main field: "ok", "ko", "mb"
  message?: string; // This contains the actual status like "Accepted", "Rejected", etc.
  connections?: number;
  // Additional fields that might be present
  valid?: boolean;
  status?: string;
  is_valid?: boolean;
  result?: string;
  is_disposable?: boolean;
  is_catch_all?: boolean;
  is_spam?: boolean;
  is_role_account?: boolean;
  risk?: string;
  error?: string;
}

function arrayToCSV(data: VerificationResult[]): string {
  if (!data?.length) return "email,firstName,status,details";
  
  const headers: (keyof VerificationResult)[] = ['email', 'firstName', 'status', 'details'];
  
  const csvRows = [
    headers.join(","),
    ...data.map((row) =>
      headers
        .map((h) => {
          const val = row[h];
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

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function extractFirstNameFromEmail(email: string): string {
  return email.split("@")[0]?.split('.')[0] || "";
}

async function verifyEmail(email: string, token: string): Promise<VerificationResult> {
  const firstName = extractFirstNameFromEmail(email);
  
  if (!isValidEmail(email)) {
    return { 
      email, 
      firstName, 
      status: "ko", 
      details: "reject" 
    };
  }

  const url = `${VERIFY_URL_BASE}?email=${encodeURIComponent(email)}&token=${token}`;
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // Reduced to 15s
    
    console.log(`🔍 Verifying: ${email}`);
    const res = await fetch(url, { 
      signal: controller.signal 
    });
    
    clearTimeout(timeoutId);

    if (!res.ok) {
      console.log(`❌ API Error for ${email}: ${res.status}`);
      return { 
        email, 
        firstName, 
        status: "md",
        details: "timeout" 
      };
    }
    
    const data: NinjaVerifierResponse = await res.json();
    
    console.log(`📨 RAW API Response for ${email}:`, JSON.stringify(data));
    
    // SIMPLIFIED and CORRECT mapping based on actual Ninja Verifier API
    let status = "md";
    let details = "unknown";

    // Primary mapping - use the 'code' field which is the main indicator
    if (data.code === "ok") {
      status = "ok";
      // Map message to proper detail
      details = mapMessageToDetail(data.message);
    } 
    else if (data.code === "ko") {
      status = "ko";
      details = mapMessageToDetail(data.message);
    }
    else if (data.code === "mb") {
      status = "md";
      details = mapMessageToDetail(data.message);
    }
    // Fallback to other common API response formats
    else if (data.valid === true || data.is_valid === true || data.status === "valid" || data.result === "valid") {
      status = "ok";
      details = "accept";
    }
    else if (data.valid === false || data.is_valid === false || data.status === "invalid" || data.result === "invalid") {
      status = "ko";
      details = "reject";
    }
    else if (data.is_disposable === true) {
      status = "ko";
      details = "disposable";
    }
    else if (data.is_catch_all === true) {
      status = "ok";
      details = "catch all";
    }
    else if (data.is_catch_all === false) {
      status = "md";
      details = "no catch";
    }
    else if (data.is_spam === true) {
      status = "ko";
      details = "spam block";
    }
    else if (data.is_role_account === true) {
      status = "md";
      details = "role account";
    }
    else if (data.error) {
      status = "md";
      details = "api_error";
    }
    else {
      // If we can't determine, use the message directly
      status = "md";
      details = data.message ? data.message.toLowerCase().replace(/\s+/g, '_') : "unknown";
    }
    
    console.log(`✅ Final mapped status for ${email}: ${status} - ${details}`);
    
    return { 
      email, 
      firstName, 
      status, 
      details
    };
    
  } catch (error: any) {
    console.log(`💥 Network error for ${email}:`, error.message);
    return { 
      email, 
      firstName, 
      status: "md",
      details: "timeout" 
    };
  }
}

// Helper function to map Ninja Verifier messages to consistent details
function mapMessageToDetail(message?: string): string {
  if (!message) return "unknown";
  
  const messageLower = message.toLowerCase();
  
  // Map common Ninja Verifier messages to our detail types
  if (messageLower.includes("accept") || messageLower.includes("valid")) {
    return "accept";
  } else if (messageLower.includes("reject") || messageLower.includes("invalid")) {
    return "reject";
  } else if (messageLower.includes("timeout")) {
    return "timeout";
  } else if (messageLower.includes("catch")) {
    return "catch all";
  } else if (messageLower.includes("disposable")) {
    return "disposable";
  } else if (messageLower.includes("spam")) {
    return "spam block";
  } else if (messageLower.includes("role")) {
    return "role account";
  } else if (messageLower.includes("unverifiable") || messageLower.includes("unknown")) {
    return "unverifiable";
  } else if (messageLower.includes("limited")) {
    return "limited";
  } else if (messageLower.includes("mx")) {
    return "mx error";
  }
  
  return messageLower.replace(/\s+/g, '_');
}

// Optimized batch processing
async function verifyEmailsInBatches(
  emails: string[],
  token: string,
  batchSize = 10, // Reduced batch size
  delayBetweenBatches = 500 // Reduced delay
): Promise<VerificationResult[]> {
  const results: VerificationResult[] = [];
  
  for (let i = 0; i < emails.length; i += batchSize) {
    const batch = emails.slice(i, i + batchSize);
    console.log(`🔄 Processing batch ${Math.floor(i/batchSize) + 1} with ${batch.length} emails`);
    
    const batchPromises = batch.map(email => verifyEmail(email, token));
    const batchResults = await Promise.allSettled(batchPromises);
    
    const successfulResults = batchResults
      .filter((result): result is PromiseFulfilledResult<VerificationResult> => 
        result.status === 'fulfilled'
      )
      .map(result => result.value);
    
    results.push(...successfulResults);
    
    // Small delay to avoid overwhelming the API
    if (i + batchSize < emails.length) {
      await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
    }
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

    const validEmails = emails
      .filter(email => typeof email === 'string' && email.trim().length > 0)
      .map(email => email.trim().toLowerCase())
      .filter((email, index, self) => self.indexOf(email) === index);

    if (validEmails.length === 0) {
      return new Response(JSON.stringify({ message: "No valid emails provided" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (validEmails.length > 1000) {
      return new Response(JSON.stringify({ message: "Maximum 1000 emails allowed" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const apiKey = process.env.NINJA_EMAIL_VERIFIER_API_KEY;
    if (!apiKey) {
      console.error("NINJA_EMAIL_VERIFIER_API_KEY is not set");
      return new Response(JSON.stringify({ message: "Server error: missing API key" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get token from NinjaVerifier
    let token: string;
    try {
      console.log("🔑 Fetching token from NinjaVerifier...");
      const tokenResponse = await fetch(`${TOKEN_URL}${apiKey}`);
      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error("Token fetch failed:", tokenResponse.status, errorText);
        return new Response(
          JSON.stringify({ 
            message: "Failed to get verification token", 
            details: errorText 
          }),
          { 
            status: tokenResponse.status, 
            headers: { "Content-Type": "application/json" } 
          }
        );
      }

      const tokenJson = await tokenResponse.json();
      token = tokenJson.token;
      
      if (!token) {
        console.error("No token received from NinjaVerifier");
        return new Response(
          JSON.stringify({ message: "Token not received from verification service" }),
          { 
            status: 500, 
            headers: { "Content-Type": "application/json" } 
          }
        );
      }
      
      console.log("✅ Token received successfully");
    } catch (error) {
      console.error("Token fetch error:", error);
      return new Response(
        JSON.stringify({ 
          message: "Failed to connect to verification service",
          details: String(error)
        }),
        { 
          status: 503, 
          headers: { "Content-Type": "application/json" } 
        }
      );
    }

    console.log(`🚀 Starting verification for ${validEmails.length} emails`);
    
    const results = await verifyEmailsInBatches(validEmails, token, 10, 500);

    console.log(`🎉 Verification completed: ${results.length} results`);
    
    // Log sample responses to debug
    if (results.length > 0) {
      console.log('📊 Sample results:', results.slice(0, 3));
    }
    
    const statusCounts = results.reduce((acc, result) => {
      const statusKey = result.status;
      acc[statusKey] = (acc[statusKey] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const detailCounts = results.reduce((acc, result) => {
      const detailKey = result.details;
      acc[detailKey] = (acc[detailKey] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    console.log('📊 Status summary:', statusCounts);
    console.log('📈 Details summary:', detailCounts);
    
    const csvString = arrayToCSV(results);

    return new Response(csvString, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": "attachment; filename=verified_emails.csv",
      },
    });
  } catch (error) {
    console.error("💥 Unexpected error in verification:", error);
    return new Response(
      JSON.stringify({ 
        message: "Internal server error", 
        error: String(error) 
      }),
      { 
        status: 500, 
        headers: { "Content-Type": "application/json" } 
      }
    );
  }
}