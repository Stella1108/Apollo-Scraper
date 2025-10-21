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

// Enhanced token caching with better error handling
let cachedToken: { token: string; expiry: number } | null = null;

async function getToken(): Promise<string> {
  const apiKey = process.env.NINJA_EMAIL_VERIFIER_API_KEY;
  if (!apiKey) {
    console.error("❌ NINJA_EMAIL_VERIFIER_API_KEY is not configured");
    throw new Error("Email verification service is not configured properly");
  }

  // Return cached token if valid (22 hours cache)
  if (cachedToken && Date.now() < cachedToken.expiry) {
    console.log("🔑 Using cached token");
    return cachedToken.token;
  }

  try {
    console.log("🔄 Fetching new token...");
    const tokenResponse = await fetch(`${TOKEN_URL}${apiKey}`, {
      method: 'GET',
      headers: {
        'User-Agent': 'EmailVerifier/2.0',
        'Accept': 'application/json',
      }
    });
    
    if (!tokenResponse.ok) {
      throw new Error(`Token API responded with status: ${tokenResponse.status}`);
    }

    const tokenData = await tokenResponse.json();
    
    if (!tokenData.token) {
      throw new Error("No token received from token service");
    }

    console.log("✅ Token acquired successfully");

    // Cache token for 22 hours
    cachedToken = {
      token: tokenData.token,
      expiry: Date.now() + 22 * 60 * 60 * 1000
    };

    return tokenData.token;
  } catch (error) {
    console.error("❌ Token acquisition error:", error);
    throw new Error(`Failed to get verification token: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Enhanced batch processing with 10 concurrent requests
async function processEmailsConcurrently(emails: string[], token: string): Promise<VerificationResult[]> {
  const CONCURRENT_REQUESTS = 10;
  const results: VerificationResult[] = [];
  
  console.log(`🔄 Processing ${emails.length} emails with concurrency ${CONCURRENT_REQUESTS}`);
  
  // Process in concurrent groups of 10
  for (let i = 0; i < emails.length; i += CONCURRENT_REQUESTS) {
    const batch = emails.slice(i, i + CONCURRENT_REQUESTS);
    const batchNumber = Math.floor(i / CONCURRENT_REQUESTS) + 1;
    
    console.log(`📦 Processing batch ${batchNumber}/${Math.ceil(emails.length / CONCURRENT_REQUESTS)}`);

    const batchPromises = batch.map(email => 
      verifySingleEmailWithRetry(email, token, 2)
    );

    try {
      const batchResults = await Promise.allSettled(batchPromises);
      
      // Process both successful and failed promises
      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          console.warn(`❌ Failed to verify ${batch[index]}:`, result.reason);
          results.push(createFailedResult(batch[index]));
        }
      });
      
      // Conservative delay between batches to respect rate limits
      if (i + CONCURRENT_REQUESTS < emails.length) {
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
    } catch (error) {
      console.error(`❌ Batch ${batchNumber} failed:`, error);
      // If entire batch fails, add failed results and continue
      const failedResults = batch.map(email => createFailedResult(email));
      results.push(...failedResults);
    }
  }

  console.log(`✅ Completed processing ${results.length} emails`);
  return results;
}

// Enhanced email verification with better timeout handling
async function verifySingleEmailWithRetry(
  email: string, 
  token: string, 
  maxRetries: number = 2
): Promise<VerificationResult> {
  const firstName = extractFirstNameFromEmail(email);
  
  // Enhanced email validation
  if (!isValidEmail(email)) {
    console.log(`❌ Invalid email format: ${email}`);
    return createResult(email, firstName, "ko", "invalid_format");
  }

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const url = `${VERIFY_URL_BASE}?email=${encodeURIComponent(email)}&token=${token}`;
      
      console.log(`🔍 Attempt ${attempt} for ${email}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
        console.log(`⏰ Timeout for ${email} on attempt ${attempt}`);
      }, 10000);

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'EmailVerifier/2.0',
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: NinjaVerifierResponse = await response.json();
      
      console.log(`✅ Success for ${email} on attempt ${attempt}:`, data);
      
      // Map Ninja Verifier response to our status
      return mapNinjaResponseToResult(email, firstName, data);

    } catch (error) {
      lastError = error as Error;
      console.warn(`⚠️ Attempt ${attempt} failed for ${email}:`, error);
      
      if (attempt === maxRetries) {
        const errorType = lastError.name === 'AbortError' ? "timeout" : "api_error";
        console.log(`❌ All attempts failed for ${email}, final error: ${errorType}`);
        return createResult(email, firstName, "md", errorType);
      }
      
      // Exponential backoff with jitter
      const baseDelay = attempt * 1000;
      const jitter = Math.random() * 1000;
      const delay = baseDelay + jitter;
      console.log(`⏳ Waiting ${delay}ms before retry ${attempt + 1} for ${email}`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  return createResult(email, firstName, "md", "max_retries_exceeded");
}

// Enhanced response mapping
function mapNinjaResponseToResult(
  email: string, 
  firstName: string, 
  data: NinjaVerifierResponse
): VerificationResult {
  console.log(`📨 Mapping response for ${email}:`, data);

  // Handle different response formats from Ninja API
  if (data.code === "ok" || data.valid === true || data.is_valid === true || data.status === "valid") {
    const details = data.message?.toLowerCase().replace(/\s+/g, '_') || "valid";
    return createResult(email, firstName, "ok", details);
  }
  
  if (data.code === "ko" || data.valid === false || data.is_valid === false || data.status === "invalid") {
    const details = data.message?.toLowerCase().replace(/\s+/g, '_') || "invalid";
    return createResult(email, firstName, "ko", details);
  }
  
  if (data.error) {
    console.warn(`❌ API error for ${email}:`, data.error);
    return createResult(email, firstName, "md", "api_error");
  }
  
  // Handle unknown or unexpected responses
  console.warn(`❓ Unknown response format for ${email}:`, data);
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
  return emailRegex.test(email) && email.length <= 254;
}

function extractFirstNameFromEmail(email: string): string {
  const localPart = email.split("@")[0];
  if (!localPart) return "unknown";
  
  // Remove numbers and special characters, then take first part
  const namePart = localPart.replace(/[0-9_\-\.]/g, ' ').split(' ')[0];
  return namePart || localPart.slice(0, 10);
}

function arrayToCSV(data: VerificationResult[]): string {
  if (!data?.length) return "Email,First Name,Status,Details\n";
  
  const headers = ['Email', 'First Name', 'Status', 'Details'];
  const csvRows = [
    headers.join(","),
    ...data.map(row => {
      const escapedEmail = `"${row.email.replace(/"/g, '""')}"`;
      const escapedFirstName = `"${row.firstName.replace(/"/g, '""')}"`;
      const escapedStatus = `"${row.status.replace(/"/g, '""')}"`;
      const escapedDetails = `"${row.details.replace(/"/g, '""')}"`;
      
      return [escapedEmail, escapedFirstName, escapedStatus, escapedDetails].join(",");
    })
  ];
  
  return csvRows.join("\n");
}

// Enhanced POST handler with comprehensive error handling
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    console.log("📨 Received email verification request");
    
    // Parse request body
    let emails: string[];
    try {
      emails = await request.json();
    } catch (parseError) {
      console.error("❌ JSON parse error:", parseError);
      return new Response(
        JSON.stringify({ 
          success: false,
          message: "Invalid JSON in request body",
          error: "Invalid JSON format"
        }), { 
          status: 400, 
          headers: { 
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type"
          } 
        }
      );
    }

    // Validate input
    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: false,
          message: "No emails provided. Please provide an array of email addresses." 
        }), {
          status: 400,
          headers: { 
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          },
        });
    }

    console.log(`📧 Received ${emails.length} emails for verification`);

    // Validate and deduplicate emails
    const validEmails = emails
      .filter(email => typeof email === 'string' && email.trim().length > 0)
      .map(email => email.trim().toLowerCase())
      .filter(email => isValidEmail(email))
      .filter((email, index, self) => self.indexOf(email) === index);

    if (validEmails.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: false,
          message: "No valid email addresses provided. Please check the email formats." 
        }), {
          status: 400,
          headers: { 
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          },
        });
    }

    console.log(`✅ ${validEmails.length} valid emails after filtering`);

    // Limit for performance and cost - increased to 100
    if (validEmails.length > 100) {
      return new Response(
        JSON.stringify({ 
          success: false,
          message: "Maximum 100 emails allowed per request for performance reasons",
          maxAllowed: 100,
          provided: validEmails.length
        }), {
          status: 400,
          headers: { 
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          },
        });
    }

    // Get authentication token
    let token: string;
    try {
      token = await getToken();
    } catch (tokenError) {
      console.error("❌ Token error:", tokenError);
      return new Response(
        JSON.stringify({ 
          success: false,
          message: "Email verification service is currently unavailable. Please try again later.",
          error: "Token acquisition failed"
        }), { 
          status: 503, 
          headers: { 
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          } 
        }
      );
    }

    // Process emails with 10 concurrent requests
    const results = await processEmailsConcurrently(validEmails, token);
    
    const csvString = arrayToCSV(results);
    const endTime = Date.now();
    const processingTime = endTime - startTime;

    console.log(`🎉 Verification completed in ${processingTime}ms. Processed: ${results.length}, Valid: ${results.filter(r => r.status === "ok").length}`);

    return new Response(csvString, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": "attachment; filename=verified_emails.csv",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "X-Processed-Count": results.length.toString(),
        "X-Valid-Count": results.filter(r => r.status === "ok").length.toString(),
        "X-Invalid-Count": results.filter(r => r.status === "ko").length.toString(),
        "X-Unknown-Count": results.filter(r => r.status === "md").length.toString(),
        "X-Processing-Time": processingTime.toString() + "ms",
      },
    });

  } catch (error: any) {
    console.error("💥 Unexpected verification error:", error);
    const endTime = Date.now();
    
    return new Response(
      JSON.stringify({ 
        success: false,
        message: "An unexpected error occurred during email verification. Please try again.",
        error: error.message || "Internal server error",
        processingTime: (endTime - startTime) + "ms"
      }), { 
        status: 500, 
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type"
        } 
      }
    );
  }
}

// Enhanced CORS handling for preflight requests
export async function OPTIONS(request: NextRequest) {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
      'Access-Control-Max-Age': '86400',
    },
  });
}

// Add GET handler for health checks
export async function GET(request: NextRequest) {
  return new Response(
    JSON.stringify({ 
      status: "healthy",
      service: "Email Verification API",
      timestamp: new Date().toISOString(),
      version: "2.0.0",
      batchSize: 10
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    }
  );
}