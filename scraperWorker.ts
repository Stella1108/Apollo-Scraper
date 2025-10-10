import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

const AMPLELEADS_API_KEY = process.env.AMPLELEADS_API_KEY;

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const { url, leadsCount, fileName, fileFormat } = await request.json();

    if (!url || !leadsCount) {
      return NextResponse.json({ message: "Missing url or leadsCount" }, { status: 400 });
    }

    if (!AMPLELEADS_API_KEY) {
      console.error("API key missing");
      return NextResponse.json({ message: "Server error: missing API key" }, { status: 500 });
    }

    const format = fileFormat === "xlsx" ? "xlsx" : "csv";
    const finalFileName = fileName || `scrape_results.${format}`;

    // Insert request with pending status
    const { data: requestData, error: insertError } = await supabase
      .from("scraper_requests")
      .insert({
        url,
        leads_count: leadsCount,
        file_name: finalFileName,
        file_format: format,
        status: "pending",
        requested: leadsCount,
        extracted: 0,
        credits: leadsCount,
        error_message: null,
      })
      .select()
      .single();

    if (insertError || !requestData) {
      console.error(insertError);
      return NextResponse.json({ message: insertError?.message || "Insert failed" }, { status: 500 });
    }

    // Async scraping function - no await here since we return immediately
    async function performScraping(requestId: string) {
      try {
        const apiResponse = await fetch(
          `https://api.ampleleads.io/v1/apollo/scrape?api_key=${AMPLELEADS_API_KEY}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify({
              apollo_url: url,
              fetch_count: Math.min(Math.max(leadsCount, 100), 50000),
              file_format: format,
            }),
          }
        );

        if (!apiResponse.ok) {
          const errorJson = await apiResponse.json().catch(() => null);
          // On overload error, leave status as pending for retry later
          if (errorJson?.error === "apollo_scraper_overloaded") {
            console.log("AmpleLeads overloaded, retry later:", requestId);
            // Do not update status, just log and return
            return;
          }
          const errorMessage = errorJson ? JSON.stringify(errorJson) : "Unknown scraping error";
          await supabase
            .from("scraper_requests")
            .update({ status: "failed", error_message: errorMessage })
            .eq("id", requestId);
          console.error("Scrape failed:", errorMessage);
          return;
        }

        const result = await apiResponse.json();

        await supabase
          .from("scraper_requests")
          .update({
            status: "completed",
            extracted: result.extractedLeadsCount || 0,
            download_link: result.downloadUrl || null,
            error_message: null,
          })
          .eq("id", requestId);
      } catch (err) {
        // Typescript safe error handling
        let message = "";
        if (err instanceof Error) {
          message = err.message;
        } else {
          message = String(err);
        }
        console.error("Scrape error caught:", message);
        await supabase
          .from("scraper_requests")
          .update({ status: "failed", error_message: message })
          .eq("id", requestId);
      }
    }

    // Trigger async scrape without awaiting
    performScraping(requestData.id);

    // Return inserted request immediately (status "pending")
    return NextResponse.json(requestData);
  } catch (error) {
    let message = "";
    if (error instanceof Error) {
      message = error.message;
    } else {
      message = String(error);
    }
    console.error("Unexpected error:", message);
    return NextResponse.json({ message: message || "Internal Server Error" }, { status: 500 });
  }
}
