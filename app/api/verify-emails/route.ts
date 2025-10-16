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
  code?: string;
  message?: string;
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
  mx?: boolean;
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

function mapMessageToDetail(message?: string): string {
  if (!message) return "unknown";
  
  const messageLower = message.toLowerCase();
  
  const messageMap: { [key: string]: string } = {
    "accepted": "accept",
    "valid": "accept", 
    "rejected": "reject",
    "invalid": "reject",
    "spam": "spam_block",
    "spam block": "spam_block",
    "disposable": "disposable",
    "catch all": "catch_all",
    "catch-all": "catch_all",
    "role": "role_account",
    "role account": "role_account",
    "timeout": "timeout",
    "unverifiable": "unverifiable",
    "unknown": "unknown",
    "limited": "limited",
    "mx error": "mx_error",
    "no mx": "no_mx",
    "high risk": "high_risk",
    "medium risk": "medium_risk",
    "low risk": "low_risk",
    "accept": "accept",
    "reject": "reject"
  };
  
  for (const [key, value] of Object.entries(messageMap)) {
    if (messageLower === key.toLowerCase() || messageLower.includes(key.toLowerCase())) {
      return value;
    }
  }
  
  return messageLower.replace(/\s+/g, '_');
}

async function verifyEmail(email: string, token: string): Promise<VerificationResult> {
  const firstName = extractFirstNameFromEmail(email);
  
  if (!isValidEmail(email)) {
    return { 
      email, 
      firstName, 
      status: "ko", 
      details: "invalid_format" 
    };
  }

  const url = `${VERIFY_URL_BASE}?email=${encodeURIComponent(email)}&token=${token}`;
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    
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
        details: "service_error" 
      };
    }
    
    const data: NinjaVerifierResponse = await res.json();
    
    console.log(`📨 API Response for ${email}:`, JSON.stringify(data));
    
    let status = "md";
    let details = "unknown";

    if (data.code === "ok") {
      status = "ok";
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
    else if (data.valid === true || data.is_valid === true) {
      status = "ok";
      details = "accept";
    }
    else if (data.valid === false || data.is_valid === false) {
      status = "ko";
      details = "reject";
    }
    else if (data.is_disposable === true) {
      status = "ko";
      details = "disposable";
    }
    else if (data.is_catch_all === true) {
      status = "ok";
      details = "catch_all";
    }
    else if (data.is_catch_all === false) {
      status = "md";
      details = "no_catch_all";
    }
    else if (data.is_spam === true) {
      status = "ko";
      details = "spam_block";
    }
    else if (data.is_role_account === true) {
      status = "md";
      details = "role_account";
    }
    else if (data.risk === "high") {
      status = "ko";
      details = "high_risk";
    }
    else if (data.risk === "medium") {
      status = "md";
      details = "medium_risk";
    }
    else if (data.risk === "low") {
      status = "ok";
      details = "low_risk";
    }
    else if (data.status === "valid" || data.result === "valid") {
      status = "ok";
      details = "accept";
    }
    else if (data.status === "invalid" || data.result === "invalid") {
      status = "ko";
      details = "reject";
    }
    else if (data.mx === false) {
      status = "ko";
      details = "no_mx";
    }
    else if (data.error) {
      status = "md";
      details = "api_error";
    }
    else {
      status = "md";
      details = data.message ? data.message.toLowerCase().replace(/\s+/g, '_') : "unknown";
    }
    
    console.log(`✅ Final status for ${email}: ${status} - ${details}`);
    
    return { 
      email, 
      firstName, 
      status, 
      details
    };
    
  } catch (error: any) {
    console.log(`💥 Network error for ${email}:`, error.message);
    
    let errorDetail = "timeout";
    if (error.name === 'AbortError') {
      errorDetail = "timeout";
    } else if (error.message.includes('fetch failed') || error.message.includes('network')) {
      errorDetail = "network_error";
    } else {
      errorDetail = "verification_error";
    }
    
    return { 
      email, 
      firstName, 
      status: "md", 
      details: errorDetail 
    };
  }
}

async function verifyEmailsInBatches(
  emails: string[],
  token: string,
  batchSize = 25,
  delayBetweenBatches = 800
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
    
    console.log(`✅ Batch ${Math.floor(i/batchSize) + 1} completed: ${successfulResults.length}/${batch.length} successful`);
    
    if (i + batchSize < emails.length) {
      await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
    }
  }
  
  return results;
}

export async function POST(request: NextRequest): Promise<Response> {
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

    if (validEmails.length > 50000) {
      return new Response(JSON.stringify({ message: "Maximum 50,000 emails allowed" }), {
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
    
    const results = await verifyEmailsInBatches(validEmails, token, 25, 800);

    console.log(`🎉 Verification completed: ${results.length} results`);
    
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