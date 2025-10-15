import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const AMPLELEADS_API_KEY = process.env.AMPLELEADS_API_KEY!;
const POLL_INTERVAL_MS = 5000;
const MAX_POLL_RETRIES = 20;

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getJitteredDelay(baseDelay: number): number {
  const jitter = Math.random() * 0.5 + 0.75; // 75% to 125%
  return Math.round(baseDelay * jitter);
}

function isFilteredApolloUrl(url: string) {
  return url.startsWith("https://app.apollo.io/#/people");
}

async function pollRunStatus(runId: string) {
  let pollAttempts = 0;
  while (pollAttempts < MAX_POLL_RETRIES) {
    const res = await fetch(`https://api.ampleleads.io/v1/apollo/status/${runId}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "x-api-key": AMPLELEADS_API_KEY,
      },
    });
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Failed to get run status: ${res.status} ${errorText}`);
    }
    const { status } = await res.json();
    if (status === "completed") return;
    if (status === "failed") throw new Error("Scrape run failed");
    const backoffDelay = getJitteredDelay(POLL_INTERVAL_MS * 2 ** pollAttempts);
    await delay(backoffDelay);
    pollAttempts++;
  }
  throw new Error("Exceeded maximum polling retries");
}

async function startScrapeWithRetries(url: string, leadsCount: number, format: string, maxRetries = 5) {
  const apiUrl = `https://api.ampleleads.io/v1/apollo/scrape?api_key=${AMPLELEADS_API_KEY}`;
  let attempt = 0;
  let lastError: any = null;
  while (attempt < maxRetries) {
    try {
      const startResponse = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apollo_url: url,
          fetch_count: Math.min(Math.max(leadsCount, 1), 50000),
          file_format: format,
        }),
      });
      if (startResponse.ok) return await startResponse.json();
      const errorJson = await startResponse.json().catch(() => null);
      if (errorJson?.error === "apollo_scraper_overloaded") {
        const baseDelay = 2000 * 2 ** attempt;
        const delayTime = getJitteredDelay(baseDelay);
        console.warn(`AmpleLeads overloaded, retrying in ${delayTime}ms (attempt ${attempt + 1})`);
        await delay(delayTime);
        attempt++;
        lastError = errorJson;
        continue;
      } else {
        throw new Error(JSON.stringify(errorJson) || "Failed to start scrape run");
      }
    } catch (error) {
      if (attempt >= maxRetries - 1) throw error;
      const baseDelay = 2000 * 2 ** attempt;
      const delayTime = getJitteredDelay(baseDelay);
      console.warn(`Error occured, retrying in ${delayTime}ms (attempt ${attempt + 1})`);
      await delay(delayTime);
      attempt++;
      lastError = error;
    }
  }
  throw new Error(JSON.stringify(lastError) || "Failed to start scrape run after retries");
}

export async function POST(request: NextRequest) {
  try {
    // Get all fields, including user_id from frontend
    const { url, leadsCount, fileName, fileFormat, user_id } = await request.json();

    if (!url || !leadsCount || !user_id) {
      return NextResponse.json(
        { message: "Missing url, leadsCount or user_id" },
        { status: 400 }
      );
    }

    if (!isFilteredApolloUrl(url)) {
      return NextResponse.json(
        { message: "Please provide a valid Apollo.io People search URL." },
        { status: 400 }
      );
    }

    const format = fileFormat === "xlsx" ? "xlsx" : "csv";
    const finalFileName = fileName?.trim() || `scrape_results.${format}`;

    // Insert scrape request with user_id set (CRITICAL!)
    const { data: requestData, error: insertError } = await supabaseAdmin
      .from("scraper_requests")
      .insert({
        user_id, // <-- ensure user_id is set
        url,
        leads_count: Number(leadsCount),
        file_name: finalFileName,
        file_format: format,
        status: "pending",
        requested: Number(leadsCount),
        extracted: 0,
        credits: Number(leadsCount),
        error_message: null,
      })
      .select()
      .single();

    if (insertError || !requestData) {
      return NextResponse.json(
        { message: insertError?.message || "Failed to record scrape request" },
        { status: 500 }
      );
    }

    // Start scraping
    let startData;
    try {
      startData = await startScrapeWithRetries(url, Number(leadsCount), format);
    } catch (startError) {
      await supabaseAdmin.from("scraper_requests").update({
        status: "failed",
        error_message: (startError as Error).message,
      }).eq("id", requestData.id);
      return NextResponse.json({ message: "Failed to start scrape run", details: (startError as Error).message }, { status: 500 });
    }

    const runId = startData.run_id;
    if (!runId) {
      await supabaseAdmin.from("scraper_requests").update({
        status: "failed",
        error_message: "No run_id returned from AmpleLeads"
      }).eq("id", requestData.id);
      return NextResponse.json({ message: "No run_id returned from AmpleLeads" }, { status: 500 });
    }

    // Poll scrape status
    try {
      await pollRunStatus(runId);
    } catch (pollError) {
      await supabaseAdmin.from("scraper_requests").update({
        status: "failed",
        error_message: (pollError as Error).message,
      }).eq("id", requestData.id);
      return NextResponse.json({ message: "Scrape run failed", details: (pollError as Error).message }, { status: 500 });
    }

    // Fetch exported results
    const exportResponse = await fetch(`https://api.ampleleads.io/v1/apollo/export/${runId}?api_key=${AMPLELEADS_API_KEY}`, {
      method: "GET",
      headers: { Accept: "application/json" },
    });

    if (!exportResponse.ok) {
      const exportError = await exportResponse.json().catch(() => null);
      await supabaseAdmin.from("scraper_requests").update({
        status: "failed",
        error_message: JSON.stringify(exportError) || "Failed to export scrape results",
      }).eq("id", requestData.id);
      return NextResponse.json({ message: "Failed to export scrape results", details: exportError }, { status: 500 });
    }

    const exportData = await exportResponse.json();

    // Insert leads
    const leadsToInsert = (exportData.leads || []).map((lead: any) => ({
      job_id: requestData.id,
      name: lead.name ?? null,
      title: lead.title ?? null,
      company: lead.company ?? null,
      email: lead.email ?? null,
      phone: lead.phone ?? null,
      location: lead.location ?? null,
      linkedin_url: lead.linkedinUrl ?? null,
      company_website: lead.companyWebsite ?? null,
      industry: lead.industry ?? null,
      company_size: lead.companySize ?? null,
    }));

    if (leadsToInsert.length > 0) {
      await supabaseAdmin.from("scraper_leads").insert(leadsToInsert);
    }

    // Update request as completed
    await supabaseAdmin.from("scraper_requests").update({
      status: "completed",
      extracted: leadsToInsert.length,
      download_link: exportData.download_url,
      error_message: null,
    }).eq("id", requestData.id);

    return NextResponse.json({
      id: requestData.id,
      extracted: leadsToInsert.length,
      downloadLink: exportData.download_url,
    });
  } catch (error) {
    console.error("Scrape POST error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
