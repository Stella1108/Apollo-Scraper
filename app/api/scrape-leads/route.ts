
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const AMPLELEADS_API_KEY = process.env.AMPLELEADS_API_KEY!;
const POLL_INTERVAL_MS = 5000;
const MAX_POLL_RETRIES = 30;
const MAX_RETRY_ATTEMPTS = 5;
const RETRY_DELAY_MS = 10000; // 10 seconds

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getJitteredDelay(baseDelay: number): number {
  const jitter = Math.random() * 0.3 + 0.85; // 85% to 115%
  return Math.floor(baseDelay * jitter);
}

function isFilteredApolloUrl(url: string) {
  return url.startsWith("https://app.apollo.io/#/people") || 
         url.includes("apollo.io/#/people");
}

async function pollRunStatus(runId: string) {
  let pollAttempts = 0;
  
  while (pollAttempts < MAX_POLL_RETRIES) {
    try {
      const res = await fetch(`https://api.ampleleads.io/v1/apollo/status/${runId}?api_key=${AMPLELEADS_API_KEY}`, {
        method: "GET",
        headers: {
          "Accept": "application/json",
        },
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Failed to get run status: ${res.status} ${errorText}`);
      }
      
      const data = await res.json();
      
      if (data.status === "completed") return data;
      if (data.status === "failed") throw new Error("Scrape run failed");
      
      // If still processing, wait and retry
      const backoffDelay = getJitteredDelay(POLL_INTERVAL_MS * Math.pow(1.5, pollAttempts));
      console.log(`Polling attempt ${pollAttempts + 1}, waiting ${backoffDelay}ms`);
      await delay(backoffDelay);
      pollAttempts++;
      
    } catch (error) {
      if (pollAttempts >= MAX_POLL_RETRIES - 1) throw error;
      const backoffDelay = getJitteredDelay(POLL_INTERVAL_MS * Math.pow(1.5, pollAttempts));
      await delay(backoffDelay);
      pollAttempts++;
    }
  }
  
  throw new Error("Exceeded maximum polling retries");
}

async function startScrapeRunWithRetry(url: string, leadsCount: number, format: string) {
  let attempt = 0;
  
  while (attempt < MAX_RETRY_ATTEMPTS) {
    try {
      const apiUrl = `https://api.ampleleads.io/v1/apollo/scrape?api_key=${AMPLELEADS_API_KEY}`;
      
      const payload = {
        apollo_url: url,
        fetch_count: Math.min(Math.max(leadsCount, 1), 10000),
        file_format: format,
      };

      console.log(`Starting scrape attempt ${attempt + 1} with payload:`, { ...payload });

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      console.log(`Scrape attempt ${attempt + 1} response status:`, response.status);

      if (response.ok) {
        const result = await response.json();
        console.log(`Scrape attempt ${attempt + 1} successful:`, result);
        return result;
      }

      const errorText = await response.text();
      console.error(`Scrape attempt ${attempt + 1} error:`, errorText);

      // Parse error to check if it's overloaded
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: "unknown", message: errorText };
      }

      // If service is overloaded, retry with exponential backoff
      if (errorData.error === "apollo_scraper_overloaded") {
        attempt++;
        if (attempt >= MAX_RETRY_ATTEMPTS) {
          throw new Error("Apollo service is currently overloaded. Please try again in a few minutes.");
        }
        
        const backoffDelay = getJitteredDelay(RETRY_DELAY_MS * Math.pow(2, attempt - 1));
        console.log(`Service overloaded, retrying in ${backoffDelay}ms (attempt ${attempt + 1}/${MAX_RETRY_ATTEMPTS})`);
        await delay(backoffDelay);
        continue;
      }

      // For other errors, throw immediately
      throw new Error(`HTTP ${response.status}: ${errorText}`);

    } catch (error: any) {
      if (attempt >= MAX_RETRY_ATTEMPTS - 1) throw error;
      
      // For network errors, retry with exponential backoff
      const backoffDelay = getJitteredDelay(RETRY_DELAY_MS * Math.pow(2, attempt));
      console.log(`Network error, retrying in ${backoffDelay}ms (attempt ${attempt + 1}/${MAX_RETRY_ATTEMPTS})`);
      await delay(backoffDelay);
      attempt++;
    }
  }
  
  throw new Error("All scrape attempts failed");
}

export async function POST(request: NextRequest) {
  try {
    // Check if API key is available
    if (!AMPLELEADS_API_KEY) {
      console.error("AMPLELEADS_API_KEY is not set in environment variables");
      return NextResponse.json(
        { message: "API service is not properly configured. Please contact support." },
        { status: 500 }
      );
    }

    const { url, leadsCount, fileName, fileFormat, user_id } = await request.json();

    console.log("Received scrape request:", { url, leadsCount, fileName, fileFormat, user_id });

    // Validation
    if (!url || !leadsCount || !user_id) {
      return NextResponse.json(
        { message: "Missing required fields: url, leadsCount, or user_id" },
        { status: 400 }
      );
    }

    if (!isFilteredApolloUrl(url)) {
      return NextResponse.json(
        { message: "Please provide a valid Apollo.io People search URL starting with: https://app.apollo.io/#/people" },
        { status: 400 }
      );
    }

    const count = Number(leadsCount);
    if (isNaN(count) || count < 1 || count > 10000) {
      return NextResponse.json(
        { message: "Leads count must be between 1 and 10,000" },
        { status: 400 }
      );
    }

    const format = fileFormat === "xlsx" ? "xlsx" : "csv";
    const finalFileName = fileName?.trim() || `apollo_leads_${Date.now()}.${format}`;

    // Create scrape request record
    const { data: requestData, error: insertError } = await supabaseAdmin
      .from("scraper_requests")
      .insert({
        user_id,
        url,
        leads_count: count,
        file_name: finalFileName,
        file_format: format,
        status: "processing",
        requested: count,
        extracted: 0,
        credits: count,
        error_message: null,
      })
      .select()
      .single();

    if (insertError || !requestData) {
      console.error("Database insert error:", insertError);
      return NextResponse.json(
        { message: "Failed to create scrape request" },
        { status: 500 }
      );
    }

    console.log("Created scrape request:", requestData.id);

    // Start the scraping process in background
    startScrapeProcess(requestData.id, url, count, format)
      .catch(async (error) => {
        console.error("Scraping process failed:", error);
        await supabaseAdmin
          .from("scraper_requests")
          .update({
            status: "failed",
            error_message: error.message,
          })
          .eq("id", requestData.id);
      });

    // Return immediate response
    return NextResponse.json({
      id: requestData.id,
      status: "processing",
      message: "Scraping started successfully. This may take a few minutes due to high demand."
    });

  } catch (error: any) {
    console.error("Scrape POST error:", error);
    return NextResponse.json(
      { 
        message: "Failed to start scraping process",
        error: error.message 
      },
      { status: 500 }
    );
  }
}

// Separate function for the actual scraping process
async function startScrapeProcess(requestId: string, url: string, leadsCount: number, format: string) {
  try {
    console.log(`Starting scrape process for request ${requestId}`);
    
    // Start scrape run with retry logic
    const startData = await startScrapeRunWithRetry(url, leadsCount, format);
    
    if (!startData.run_id) {
      throw new Error("No run ID received from AmpleLeads");
    }

    console.log(`Scrape run started with ID: ${startData.run_id}`);

    // Poll for status
    const finalStatus = await pollRunStatus(startData.run_id);
    console.log(`Scrape run completed for ${startData.run_id}`);
    
    // Get export data
    const exportResponse = await fetch(
      `https://api.ampleleads.io/v1/apollo/export/${startData.run_id}?api_key=${AMPLELEADS_API_KEY}`,
      {
        method: "GET",
        headers: {
          "Accept": "application/json",
        },
      }
    );

    if (!exportResponse.ok) {
      const errorText = await exportResponse.text();
      throw new Error(`Failed to export scrape results: ${errorText}`);
    }

    const exportData = await exportResponse.json();
    const leads = exportData.leads || [];
    const downloadUrl = exportData.download_url;

    console.log(`Export completed. Found ${leads.length} leads, download URL: ${downloadUrl}`);

    // Insert leads into database
    if (leads.length > 0) {
      const leadsToInsert = leads.map((lead: any) => ({
        job_id: requestId,
        name: lead.name || null,
        title: lead.title || null,
        company: lead.company || null,
        email: lead.email || null,
        phone: lead.phone || null,
        location: lead.location || null,
        linkedin_url: lead.linkedinUrl || lead.linkedin_url || null,
        company_website: lead.companyWebsite || lead.company_website || null,
        industry: lead.industry || null,
        company_size: lead.companySize || lead.company_size || null,
      }));

      const { error: leadsError } = await supabaseAdmin
        .from("scraper_leads")
        .insert(leadsToInsert);

      if (leadsError) {
        console.error("Error inserting leads:", leadsError);
      }
    }

    // Update request as completed
    await supabaseAdmin
      .from("scraper_requests")
      .update({
        status: "completed",
        extracted: leads.length,
        download_link: downloadUrl,
        error_message: null,
      })
      .eq("id", requestId);

    console.log(`Scrape process completed successfully for request ${requestId}`);

  } catch (error: any) {
    console.error(`Scrape process failed for request ${requestId}:`, error);
    
    // Update request as failed
    await supabaseAdmin
      .from("scraper_requests")
      .update({
        status: "failed",
        error_message: error.message,
      })
      .eq("id", requestId);
    
    throw error;
  }
}

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("scraper_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
